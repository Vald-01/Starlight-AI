const isTauri = () => typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);

export { isTauri };

/** Opens an external URL in the user's default browser. */
export async function openExternal(url) {
  if (!url) return;
  if (!isTauri()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
