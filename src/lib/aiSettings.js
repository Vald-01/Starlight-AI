import { useSyncExternalStore } from 'react';
import { readPref, writePref } from '@/lib/prefs';

export const AI_KEY_STORAGE = 'linkvault_api_key';
const AI_KEYS_STORAGE = 'linkvault_api_keys';
export const DEFAULT_PROVIDER = 'openai';
export const OLLAMA_ORIGIN = 'http://localhost:11434';

export const AI_PROVIDERS = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    kind: 'openai',
    model: 'gpt-4o-mini',
    modelLabel: 'GPT-4o mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    keyPlaceholder: 'sk-proj-...',
    consoleUrl: 'https://platform.openai.com/api-keys',
    requiresKey: true,
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    kind: 'anthropic',
    model: 'claude-haiku-5-5',
    modelLabel: 'Claude Haiku 5.5',
    endpoint: 'https://api.anthropic.com/v1/messages',
    keyPlaceholder: 'sk-ant-...',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    requiresKey: true,
  },
  gemini: {
    id: 'gemini',
    label: 'Google',
    kind: 'gemini',
    // The alias follows Google's model retirements, which a pinned id in a desktop build cannot.
    model: 'gemini-flash-latest',
    modelLabel: 'Gemini Flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    keyPlaceholder: 'AIza...',
    consoleUrl: 'https://aistudio.google.com/app/apikey',
    requiresKey: true,
  },
  grok: {
    id: 'grok',
    label: 'xAI',
    kind: 'openai',
    model: 'grok-2-1212',
    modelLabel: 'Grok 2',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    keyPlaceholder: 'xai-...',
    consoleUrl: 'https://console.x.ai',
    requiresKey: true,
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    kind: 'openai',
    model: 'llama-3.3-70b-versatile',
    modelLabel: 'Llama 3.3 70B',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    keyPlaceholder: 'gsk_...',
    consoleUrl: 'https://console.groq.com/keys',
    requiresKey: true,
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama',
    kind: 'ollama',
    model: 'llama3.2',
    modelLabel: 'Local model',
    endpoint: `${OLLAMA_ORIGIN}/api/generate`,
    keyPlaceholder: '',
    consoleUrl: 'https://ollama.com/download',
    requiresKey: false,
  },
};

export const PROVIDER_ORDER = ['ollama', 'openai', 'anthropic', 'gemini', 'grok'];

const listeners = new Set();
let snapshot = null;

function readKeyMap() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(AI_KEYS_STORAGE) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeKeyMap(map) {
  try {
    window.localStorage.setItem(AI_KEYS_STORAGE, JSON.stringify(map));
  } catch {
    /* storage is optional */
  }
}

function storedProviderId() {
  return readPref('provider', '');
}

function storedLegacyKey() {
  try {
    return (window.localStorage.getItem(AI_KEY_STORAGE) || '').trim();
  } catch {
    return '';
  }
}

function readConfig() {
  const rawProvider = storedProviderId();
  // A provider that no longer exists falls back to the default.
  const providerId = AI_PROVIDERS[rawProvider] ? rawProvider : DEFAULT_PROVIDER;
  const map = readKeyMap();
  const fromMap = typeof map[providerId] === 'string' ? map[providerId] : '';
  // The single legacy key only belongs to the provider stored next to it.
  const legacyOwned = rawProvider === providerId ? storedLegacyKey() : '';
  const key = (fromMap || legacyOwned || '').trim();
  return { key, provider: AI_PROVIDERS[providerId] };
}

function getSnapshot() {
  if (!snapshot) snapshot = readConfig();
  return snapshot;
}

function emit() {
  snapshot = readConfig();
  listeners.forEach((listener) => listener());
}

export function subscribeAiConfig(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readAiConfig() {
  return getSnapshot();
}

export function keyForProvider(providerId) {
  const map = readKeyMap();
  if (map[providerId]) return map[providerId];
  return storedProviderId() === providerId ? storedLegacyKey() : '';
}

/** Local models need no key, hosted providers do. */
export function canUseAi(config) {
  if (!config?.provider) return false;
  return config.provider.requiresKey ? Boolean(config.key) : true;
}

/** Shows only a recognisable head and the last four characters of a stored key. */
export function maskApiKey(key) {
  const value = String(key || '');
  if (!value) return '';
  if (value.length <= 8) return '\u2022\u2022\u2022\u2022';
  return `${value.slice(0, Math.min(6, value.length - 4))}\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${value.slice(-4)}`;
}

export function saveAiConfig({ provider, key }) {
  const providerId = AI_PROVIDERS[provider] ? provider : DEFAULT_PROVIDER;
  const value = String(key || '').trim();
  const map = readKeyMap();
  if (value) map[providerId] = value;
  else delete map[providerId];
  try {
    writeKeyMap(map);
    writePref('provider', providerId);
    // keep the legacy single-key entry in sync with the active provider
    if (value) window.localStorage.setItem(AI_KEY_STORAGE, value);
    else window.localStorage.removeItem(AI_KEY_STORAGE);
  } catch {
    /* storage is optional */
  }
  emit();
}

export function clearAiConfig() {
  const { provider } = getSnapshot();
  const map = readKeyMap();
  delete map[provider.id];
  try {
    writeKeyMap(map);
    window.localStorage.removeItem(AI_KEY_STORAGE);
  } catch {
    /* storage is optional */
  }
  emit();
}

/** Probes the local Ollama daemon and lists the models it can serve. */
export async function detectOllama({ timeout = 1800 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${OLLAMA_ORIGIN}/api/tags`, { signal: controller.signal });
    if (!response.ok) return { running: false, models: [] };
    const payload = await response.json();
    const models = (payload?.models || []).map((entry) => entry?.name).filter(Boolean);
    return { running: true, models };
  } catch {
    return { running: false, models: [] };
  } finally {
    clearTimeout(timer);
  }
}

export function useAiConfig() {
  return useSyncExternalStore(subscribeAiConfig, getSnapshot, getSnapshot);
}
