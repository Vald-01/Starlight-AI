import { useSyncExternalStore } from 'react';

/** Tiny UI store so any surface can open the settings window on a given tab. */
export const SETTINGS_TABS = ['general', 'ai', 'appearance'];

let state = { open: false, tab: 'general' };
const listeners = new Set();

function emit(next) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function openSettings(tab = 'general') {
  emit({ open: true, tab: SETTINGS_TABS.includes(tab) ? tab : 'general' });
}

export function closeSettings() {
  emit({ ...state, open: false });
}

export function setSettingsTab(tab) {
  emit({ ...state, tab: SETTINGS_TABS.includes(tab) ? tab : state.tab });
}

export function useSettingsModal() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state
  );
}
