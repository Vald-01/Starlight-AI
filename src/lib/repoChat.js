import { canUseAi, readAiConfig } from '@/lib/aiSettings';
import { chatAi } from '@/lib/aiClient';

/**
 * Per-link chat sessions.
 *
 * Sessions live in memory only: closing the drawer keeps the conversation, quitting
 * the app drops it. Nothing is written to localStorage, so the chat never outlives
 * the window it belongs to.
 */
const sessions = new Map();
const listeners = new Set();

const EMPTY = Object.freeze({ messages: [], pending: false, error: '', draft: '', context: undefined });

const README_TIMEOUT = 7000;
const README_LIMIT = 7000;

const keyFor = (item) => String(item?.id || item?.normalizedUrl || item?.url || '');

function emit() {
  listeners.forEach((listener) => listener());
}

function update(key, patch) {
  const next = { ...(sessions.get(key) || EMPTY), ...patch };
  sessions.set(key, next);
  emit();
  return next;
}

export function subscribeRepoChat(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRepoChat(item) {
  return sessions.get(keyFor(item)) || EMPTY;
}

export function setChatDraft(item, draft) {
  update(keyFor(item), { draft: String(draft || '') });
}

export function clearChat(item) {
  const key = keyFor(item);
  sessions.set(key, { ...EMPTY });
  emit();
}

function githubTarget(url) {
  try {
    const { hostname, pathname } = new URL(url);
    if (!/(^|\.)github\.com$/i.test(hostname)) return null;
    const [owner, repo] = pathname.replace(/^\/+/, '').split('/');
    if (!owner || !repo) return null;
    const name = repo.replace(/\.git$/i, '');
    if (!name) return null;
    return { owner, repo: name };
  } catch {
    return null;
  }
}

/** Reads the repository README so answers can rely on more than the saved summary. */
async function fetchReadme(item) {
  const target = item.source === 'github' ? githubTarget(item.url) : null;
  if (!target) return '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), README_TIMEOUT);
  try {
    const response = await fetch(`https://api.github.com/repos/${target.owner}/${target.repo}/readme`, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github.raw' },
    });
    if (!response.ok) return '';
    const text = await response.text();
    return text.trim().slice(0, README_LIMIT);
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

async function ensureContext(key, item) {
  const cached = sessions.get(key);
  if (cached && cached.context !== undefined) return cached.context;
  const readme = await fetchReadme(item);
  update(key, { context: readme });
  return readme;
}

function systemPrompt(item, language, readme) {
  return [
    `You answer questions about a single saved resource: "${item.title}" (${item.url}).`,
    `Saved metadata: source ${item.source}, category ${item.category}, tags ${(item.tags || []).join(', ') || 'none'}.`,
    item.summary ? `Saved summary: ${item.summary}` : '',
    readme
      ? `Repository README excerpt (may be truncated):\n${readme}`
      : 'No source content was available: rely on the metadata above and say plainly when a detail is missing.',
    'Stay strictly on this resource: if a question is about anything else, decline in one short sentence.',
    'Never invent commands, files, versions or figures that are not in the context.',
    `Answer in ${language === 'fr' ? 'French' : 'English'}, plainly, in at most four short sentences or a compact list.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function errorCode(error, providerKind) {
  if (error?.code === 'no-ai') return 'no-ai';
  if (error?.status === 401 || error?.status === 403) return 'invalid-key';
  // Gemini answers 400 (API_KEY_INVALID) for a revoked or malformed key.
  if (providerKind === 'gemini' && error?.status === 400) return 'invalid-key';
  if (error?.name === 'AbortError') return 'timeout';
  return 'generic';
}

/** Sends one question inside the conversation attached to this link. */
export async function askRepo(item, question, { language = 'en' } = {}) {
  const key = keyFor(item);
  const text = String(question || '').trim();
  if (!key || !text) return;
  const current = sessions.get(key) || EMPTY;
  if (current.pending) return;

  const asked = update(key, {
    messages: [...current.messages, { role: 'user', content: text }],
    pending: true,
    error: '',
    draft: '',
  });

  const config = readAiConfig();

  try {
    if (!canUseAi(config)) {
      const error = new Error('no-ai');
      error.code = 'no-ai';
      throw error;
    }
    const readme = await ensureContext(key, item);
    const reply = await chatAi(config, {
      system: systemPrompt(item, language, readme),
      messages: asked.messages,
    });
    const latest = sessions.get(key) || asked;
    update(key, {
      messages: [...latest.messages, { role: 'assistant', content: reply }],
      pending: false,
      error: '',
    });
  } catch (error) {
    update(key, { pending: false, error: errorCode(error, config.provider?.kind) });
  }
}
