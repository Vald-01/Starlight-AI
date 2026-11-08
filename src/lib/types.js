import { CATEGORIES, detectSource, guessCategory } from '@/lib/constants';
import { hostOf } from '@/lib/format';

/** The single shape every stored link must have. */
export const SOURCE_IDS = ['github', 'instagram', 'web'];
export const CATEGORY_IDS = CATEGORIES.filter((category) => category.id !== 'all').map((category) => category.id);

export function createId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

/** Same resource for : query string, hash, trailing slash and .git suffix are dropped. */
export function normalizeUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    url.hash = '';
    url.search = '';
    const path = url.pathname
      .replace(/\/+$/g, '')
      .replace(/\.git$/i, '')
      .replace(/\/+$/g, '');
    return `${url.protocol}//${url.host}${path}`;
  } catch {
    return value
      .split(/[?#]/)[0]
      .replace(/\/+$/g, '')
      .replace(/\.git$/i, '');
  }
}

export function sanitizeTags(tags, limit = 5) {
  if (!Array.isArray(tags)) return [];
  return Array.from(
    new Set(
      tags
        .map((tag) => String(tag).trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-'))
        .filter(Boolean)
    )
  ).slice(0, limit);
}

function resolveSource(source, url) {
  if (SOURCE_IDS.includes(source)) return source;
  const detected = detectSource(url);
  return SOURCE_IDS.includes(detected) ? detected : 'web';
}

/** Builds a link that matches the schema exactly, filling every field with a safe default. */
export function buildLink({
  id,
  url,
  title,
  summary,
  category,
  source,
  tags,
  stats,
  createdAt,
  isFavorite,
} = {}) {
  const safeUrl = String(url || '').trim();
  const cleanTitle = String(title || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
  const rawStars = stats?.stars;
  const stars = rawStars === null || rawStars === undefined || rawStars === '' ? null : Number(rawStars);
  return {
    id: id || createId(),
    url: safeUrl,
    normalizedUrl: normalizeUrl(safeUrl),
    title: cleanTitle || hostOf(safeUrl),
    summary: String(summary || '').replace(/\s+/g, ' ').trim().slice(0, 320),
    category: CATEGORY_IDS.includes(category) ? category : guessCategory(safeUrl, cleanTitle),
    source: resolveSource(source, safeUrl),
    tags: sanitizeTags(tags),
    stats: {
      stars: stars !== null && Number.isFinite(stars) ? Math.max(0, Math.round(stars)) : null,
      language: stats?.language ? String(stats.language) : null,
    },
    createdAt: createdAt || new Date().toISOString(),
    isFavorite: Boolean(isFavorite),
  };
}

/** Maps a record saved by an older version onto the current schema. */
export function migrateLink(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const url = String(entry.url || '').trim();
  if (!url) return null;
  const legacySource = entry.source === 'youtube' ? 'web' : entry.source;
  return buildLink({
    id: entry.id,
    url,
    title: entry.title,
    summary: entry.summary ?? entry.tldr,
    category: entry.category,
    source: legacySource,
    tags: entry.tags,
    stats: {
      stars: entry.stats?.stars ?? entry.github_stars,
      language: entry.stats?.language ?? entry.language,
    },
    createdAt: entry.createdAt || entry.saved_at || entry.created_date,
    isFavorite: typeof entry.isFavorite === 'boolean' ? entry.isFavorite : entry.status === 'starred',
  });
}
