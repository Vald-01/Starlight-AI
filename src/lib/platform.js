/** On-screen label for a keyboard shortcut. The handlers themselves accept both Cmd and Ctrl. */
export function shortcutLabel(key, platform = navigator.platform) {
  return /mac/i.test(platform) ? `⌘${key}` : `Ctrl+${key}`;
}
