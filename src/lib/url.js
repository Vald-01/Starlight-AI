/** URL helpers shared by the composer, the enricher and every outbound link. */

const PRIVATE_HOSTS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^\[::1\]$/,
  /^::1$/,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

/** True for a well-formed absolute http(s) URL. Rejects javascript:, data:, file: … */
export function isHttpUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * True when the URL can be fetched safely from the app.
 * Blocks the loopback, link-local and private ranges so a pasted link cannot probe the
 * user's local network (SSRF), while still allowing the link itself to be saved.
 */
export function isFetchableUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (!host) return false;
    if (host.endsWith('.local') || host.endsWith('.internal')) return false;
    if (PRIVATE_HOSTS.some((pattern) => pattern.test(host))) return false;
    return true;
  } catch {
    return false;
  }
}

/** Accepts "example.com/path", "www.example.com" or a full URL and returns an https origin. */
export function toHttpUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return isHttpUrl(value) ? value : '';
  if (/^www\.\S+\.[a-z]{2,}/i.test(value)) {
    const candidate = `https://${value}`;
    return isHttpUrl(candidate) ? candidate : '';
  }
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(value)) {
    const candidate = `https://${value}`;
    return isHttpUrl(candidate) ? candidate : '';
  }
  return '';
}
