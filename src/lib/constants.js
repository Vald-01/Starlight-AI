export const CATEGORIES = [
  { id: "all", label: "Tous" },
  { id: "github", label: "Repositories" },
  { id: "instagram", label: "Reels & Posts" },
  { id: "article", label: "Articles & Web" },
  { id: "code", label: "Snippets" },
];

export const VAULT_TABS = [
  { id: "all", label: "Tout le coffre" },
  { id: "github", label: "GitHub" },
  { id: "instagram", label: "Instagram" },
  { id: "web", label: "Articles" },
  { id: "starred", label: "Favorites" },
];

export const sourceMeta = (source) => ({
  github: { label: "GitHub", color: "bg-neutral-800 text-white" },
  instagram: { label: "Instagram", color: "bg-pink-600 text-white" },
  web: { label: "Web", color: "bg-amber-700 text-white" },
  youtube: { label: "YouTube", color: "bg-red-600 text-white" },
}[source] ?? { label: "Web", color: "bg-amber-700 text-white" });

export const categoryLabel = (id) => {
  const cat = CATEGORIES.find((c) => c.id === id);
  return cat ? cat.label : id;
};

export const detectSource = (url = "") => {
  if (url.includes("github.com")) return "github";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return "web";
};

export const guessCategory = (url = "", text = "") => {
  const haystack = `${url} ${text}`.toLowerCase();
  if (["vue", "nuxt", "pinia"].some((hint) => haystack.includes(hint))) return "code";
  if (["github", "repository", "repo", "npm", "api", "code"].some((hint) => haystack.includes(hint))) return "github";
  const source = detectSource(url);
  if (source === "github") return "github";
  if (source === "instagram") return "instagram";
  return "article";
};

export const PROCESSING_STAGES = [
  "Analyse de l'URL...",
  "Extraction du contenu...",
  "Génération du résumé IA...",
  "Sauvegarde dans le Vault..."
];

