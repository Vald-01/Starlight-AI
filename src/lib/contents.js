export const CATEGORIES = [
  { id: 'dev-tools', label: 'Dev Tools' },
  { id: 'vue', label: 'Vue.js' },
  { id: 'ai-llm', label: 'AI / LLM' },
  { id: 'sim-racing', label: 'Sim Racing' },
  { id: 'automations', label: 'Automations' },
  { id: 'utilities', label: 'Utilities' },
];

export const SOURCES = [
  { id: 'instagram', label: 'Instagram Reel', short: 'Reel' },
  { id: 'github', label: 'GitHub Repo', short: 'Repo' },
  { id: 'web', label: 'Web Article', short: 'Web' },
];

export const SMART_FILTERS = [
  { id: 'all', label: 'All Items' },
  { id: 'unread', label: 'To Review' },
  { id: 'starred', label: 'Starred' },
  { id: 'archived', label: 'Archived' },
];

export const STATUSES = [
  { id: 'unread', label: 'To review' },
  { id: 'starred', label: 'Starred' },
  { id: 'archived', label: 'Archived' },
];

export const PROCESSING_STAGES = ['Reading link', 'Extracting content', 'Auto-tagging'];

export const MODELS = [
  { id: 'gemini_3_flash', label: 'Flash', hint: 'Fast reads, most links' },
  { id: 'gemini_3_1_pro', label: 'Pro', hint: 'Deeper analysis, slower' },
];

export const VAULT_TABS = [
  { id: 'all', label: 'All' },
  { id: 'github', label: 'GitHub Repos' },
  { id: 'instagram', label: 'Reels' },
  { id: 'web', label: 'Articles' },
  { id: 'starred', label: 'Favorites' },
];

export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? 'Unsorted';

export const sourceMeta = (id) => SOURCES.find((s) => s.id === id) ?? SOURCES[2];

const CATEGORY_HINTS = {
  'dev-tools': ['developer', 'devtools', 'cli', 'engineering', 'frontend', 'tooling', 'editor'],
  vue: ['vue', 'nuxt', 'composition', 'vite', 'pinia', 'composable'],
  'ai-llm': ['ai', 'llm', 'claude', 'gpt', 'prompt', 'transformer', 'anthropic', 'agent'],
  'sim-racing': ['sim', 'racing', 'iracing', 'acc', 'assetto', 'telemetry', 'braking', 'lap'],
  automations: ['automation', 'n8n', 'zapier', 'workflow', 'webhook', 'cron', 'pipeline'],
  utilities: ['utility', 'css', 'design', 'productivity', 'homelab', 'tool', 'dashboard'],
};

/** Rough local categorisation used when AI output has no confident category. */
export function guessCategory(url = '', text = '') {
  const haystack = `${url} ${text}`.toLowerCase();
  for (const [category, hints] of Object.entries(CATEGORY_HINTS)) {
    if (hints.some((hint) => haystack.includes(hint))) return category;
  }
  return 'utilities';
}

export function detectSource(url = '') {
  const value = url.toLowerCase();
  if (value.includes('instagram.com')) return 'instagram';
  if (value.includes('github.com')) return 'github';
  return 'web';
}