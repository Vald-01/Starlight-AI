import { useSyncExternalStore } from 'react';
import { readPref, writePref } from '@/lib/prefs';

const MODES = ['light', 'dark', 'system'];
const listeners = new Set();

let mode = null;

function systemQuery() {
  if (typeof window === 'undefined' || !window.matchMedia) return null;
  return window.matchMedia('(prefers-color-scheme: dark)');
}

function readMode() {
  const stored = readPref('theme', 'system');
  return MODES.includes(stored) ? stored : 'system';
}

export function resolveTheme(value) {
  if (value !== 'system') return value === 'dark' ? 'dark' : 'light';
  return systemQuery()?.matches ? 'dark' : 'light';
}

function apply() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const resolved = resolveTheme(getSnapshot());
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

function getSnapshot() {
  if (!mode) mode = readMode();
  return mode;
}

function subscribe(listener) {
  listeners.add(listener);
  const query = systemQuery();
  const onSystemChange = () => {
    if (getSnapshot() !== 'system') return;
    apply();
    listener();
  };
  query?.addEventListener('change', onSystemChange);
  return () => {
    listeners.delete(listener);
    query?.removeEventListener('change', onSystemChange);
  };
}

export function setThemeMode(next) {
  if (!MODES.includes(next)) return;
  mode = next;
  writePref('theme', next);
  apply();
  listeners.forEach((listener) => listener());
}

/** Flips between an explicit light and dark mode, leaving "system" once used. */
export function toggleThemeMode() {
  setThemeMode(resolveTheme(getSnapshot()) === 'dark' ? 'light' : 'dark');
}

// Apply as early as possible so the first paint already uses the right palette.
if (typeof document !== 'undefined') apply();

export function useTheme() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    mode: current,
    theme: resolveTheme(current),
    setTheme: setThemeMode,
    toggle: toggleThemeMode,
  };
}
