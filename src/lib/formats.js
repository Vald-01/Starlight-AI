export function hostOf(urlStr = "") {
  try {
    const url = new URL(urlStr);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return urlStr;
  }
}

export function titleFromUrl(urlStr = "") {
  try {
    const url = new URL(urlStr);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      return pathSegments[pathSegments.length - 1].replace(/[-_]/g, " ");
    }
    return url.hostname;
  } catch {
    return urlStr;
  }
}

export function formatCount(num) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

export function itemDate(dateStr, language = "en") {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function relativeTime(dateStr, language = "en") {
  if (!dateStr) return "";
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(language === "fr" ? "fr" : "en", { numeric: "auto" });
  if (diffMin < 1) return rtf.format(0, "minute");
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  if (diffHours < 24) return rtf.format(-diffHours, "hour");
  if (diffDays < 30) return rtf.format(-diffDays, "day");
  return itemDate(dateStr, language);
}
