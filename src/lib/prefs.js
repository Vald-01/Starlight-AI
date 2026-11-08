/**
 * Single source of truth for persisted preferences.
 * New keys are canonical; legacy keys from earlier builds are migrated on first read.
 */
export const PREFS = {
  theme: { key: 'linkvault_theme', legacy: 'linkvault-theme' },
  language: { key: 'linkvault_language', legacy: 'linkvault.language' },
  provider: { key: 'linkvault_provider', legacy: 'linkvault_ai_provider' },
  autostart: { key: 'linkvault_autostart', legacy: null },
};

export function readPref(name, fallback = '') {
  const entry = PREFS[name];
  if (!entry) return fallback;
  try {
    const current = window.localStorage.getItem(entry.key);
    if (current !== null) return current;
    if (entry.legacy) {
      const legacy = window.localStorage.getItem(entry.legacy);
      if (legacy !== null) {
        window.localStorage.setItem(entry.key, legacy);
        return legacy;
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function writePref(name, value) {
  const entry = PREFS[name];
  if (!entry) return;
  try {
    window.localStorage.setItem(entry.key, String(value));
  } catch {
    /* storage is optional */
  }
}

export function removePref(name) {
  const entry = PREFS[name];
  if (!entry) return;
  try {
    window.localStorage.removeItem(entry.key);
  } catch {
    /* storage is optional */
  }
}
