import { CATEGORY_IDS, buildLink, sanitizeTags } from '@/lib/types';
import { hostOf } from '@/lib/format';
import { translate } from '@/lib/i18n';
import { canUseAi, readAiConfig } from '@/lib/aiSettings';
import { requestAi } from '@/lib/aiClient';
import { isFetchableUrl, isHttpUrl } from '@/lib/url';

const GITHUB_API = 'https://api.github.com/repos';
const PAGE_TIMEOUT = 7000;
const NON_REPO_PATHS = [
  'orgs', 'users', 'topics', 'collections', 'settings', 'features', 'about', 'pricing',
  'login', 'explore', 'marketplace', 'sponsors', 'notifications', 'search', 'apps',
];

const report = (onStage, stage) => {
  try {
    onStage?.(stage);
  } catch {
    /* progress reporting must never break enrichment */
  }
};

async function fetchWithTimeout(url, { timeout = PAGE_TIMEOUT, ...options } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function githubTarget(url) {
  try {
    const { hostname, pathname } = new URL(url);
    if (!/(^|\.)github\.com$/i.test(hostname)) return null;
    const [owner, repo] = pathname.replace(/^\/+/, '').split('/');
    if (!owner || !repo) return null;
    if (NON_REPO_PATHS.includes(owner.toLowerCase())) return null;
    const name = repo.replace(/\.git$/i, '');
    if (!name) return null;
    return { owner, repo: name, full: `${owner}/${name}` };
  } catch {
    return null;
  }
}

function titleFromPath(url, source) {
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean);
    if (source === 'instagram') {
      const code = segments.find((segment, index) => index > 0 && ['reel', 'reels', 'p', 'tv'].includes(segments[index - 1]));
      return code ? `Instagram Reel · ${code}` : `Instagram · ${hostOf(url)}`;
    }
    const last = segments[segments.length - 1] || '';
    const pretty = decodeURIComponent(last)
      .replace(/\.(html?|php|aspx?)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    return pretty ? pretty.charAt(0).toUpperCase() + pretty.slice(1) : hostOf(url);
  } catch {
    return hostOf(url);
  }
}

async function collectGithub(target) {
  try {
    const response = await fetchWithTimeout(`${GITHUB_API}/${target.owner}/${target.repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    return {
      host: 'github.com',
      title: data.full_name || target.full,
      description: String(data.description || '').trim(),
      stars: Number.isFinite(data.stargazers_count) ? data.stargazers_count : null,
      language: data.language || null,
      topics: Array.isArray(data.topics) ? data.topics : [],
    };
  } catch {
    return { host: 'github.com', title: target.full, description: '', stars: null, language: null, topics: [] };
  }
}

async function collectPage(url, source) {
  const host = hostOf(url);
  const empty = { host, title: '', description: '', topics: [], stars: null, language: null };
  // Instagram does not allow cross-origin reads, so we file it from its URL structure.
  if (source === 'instagram') return empty;
  // Never fetch loopback, link-local or private hosts on behalf of a pasted URL.
  if (!isFetchableUrl(url)) return empty;
  try {
    const response = await fetchWithTimeout(url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(String(response.status));
    const html = (await response.text()).slice(0, 200000);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const meta = (selector) => doc.querySelector(selector)?.getAttribute('content')?.trim() || '';
    return {
      host,
      title: meta('meta[property="og:title"]') || meta('meta[name="twitter:title"]') || doc.querySelector('title')?.textContent?.trim() || '',
      description: meta('meta[property="og:description"]') || meta('meta[name="description"]') || '',
      topics: [],
      stars: null,
      language: null,
    };
  } catch {
    return empty;
  }
}

function localSummary({ source, host, description, language }) {
  if (description) return description;
  return translate(language, source === 'instagram' ? 'fallbackReel' : 'fallbackLink', { host });
}

function systemPrompt(language) {
  return [
    'You file saved links into a personal knowledge vault.',
    `Write the summary in ${language === 'fr' ? 'French' : 'English'}, in two sentences at most.`,
    'Reply with JSON only, no prose, no code fences.',
    'Schema: {"title": string, "summary": string, "category": "github" | "instagram" | "article" | "code", "tags": string[]}',
    'Tags are 1 to 5 short lowercase keywords.',
  ].join(' ');
}

/**
 * Turns a pasted URL into a schema-compliant link.
 * Steps run against real network work; the AI pass is optional and degrades to the local algorithm.
 */
export async function enrichLink(url, { mode = 'auto', language = 'en', onStage, onAiError } = {}) {
  if (!isHttpUrl(url)) {
    const error = new Error('invalid-url');
    error.code = 'invalid-url';
    throw error;
  }
  const source = routeSource(url);
  report(onStage, 'url');

  report(onStage, 'content');
  const target = source === 'github' ? githubTarget(url) : null;
  const extracted = source === 'github'
    ? target
      ? await collectGithub(target)
      : { host: hostOf(url), title: '', description: '', topics: [], stars: null, language: null }
    : await collectPage(url, source);

  report(onStage, 'summary');
  const host = extracted.host || hostOf(url);
  const draft = {
    url,
    title: extracted.title || titleFromPath(url, source),
    summary: localSummary({ source, host, description: extracted.description, language }),
    category: categoryFor(url, `${extracted.title} ${extracted.description}`),
    source,
    tags: extracted.topics.length ? extracted.topics : [host.split('.')[0], source],
    stats: { stars: extracted.stars, language: extracted.language },
  };

  const config = readAiConfig();
  if (mode !== 'local' && canUseAi(config)) {
    try {
      const ai = await requestAi(config, {
        system: systemPrompt(language),
        user: `Raw metadata:\n${JSON.stringify({
          url,
          host,
          source,
          pageTitle: extracted.title,
          description: extracted.description,
          topics: extracted.topics,
          stars: extracted.stars,
          language: extracted.language,
          model: config.provider.model,
        })}`,
      });
      if (ai) {
        if (ai.title) draft.title = ai.title;
        if (ai.summary) draft.summary = ai.summary;
        if (CATEGORY_IDS.includes(ai.category)) draft.category = ai.category;
        if (Array.isArray(ai.tags) && ai.tags.length) draft.tags = sanitizeTags([...ai.tags, ...draft.tags]);
      }
    } catch (error) {
      // 401/403 means the stored key is invalid or revoked: keep the local result and say so.
      if ((error?.status === 401 || error?.status === 403) && config.provider.requiresKey) {
        onAiError?.('invalid-key');
      }
    }
  }

  return buildLink(draft);
}

function routeSource(url) {
  const value = String(url || '').toLowerCase();
  if (value.includes('github.com')) return 'github';
  if (value.includes('instagram.com')) return 'instagram';
  return 'web';
}

function categoryFor(url, text) {
  if (routeSource(url) === 'github') return 'github';
  if (routeSource(url) === 'instagram') return 'instagram';
  const haystack = `${url} ${text || ''}`.toLowerCase();
  if (['snippet', 'function', 'code', 'npm', 'api'].some((hint) => haystack.includes(hint))) return 'code';
  return 'article';
}
