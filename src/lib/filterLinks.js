export function computeCounts(items) {
  const counts = {
    all: 0,
    starred: 0,
    categories: {},
    sources: {},
    tags: {},
  };

  for (const item of items) {
    counts.all += 1;
    counts.categories[item.category] = (counts.categories[item.category] || 0) + 1;
    counts.sources[item.source] = (counts.sources[item.source] || 0) + 1;
    if (item.isFavorite) counts.starred += 1;
    for (const tag of item.tags || []) {
      counts.tags[tag] = (counts.tags[tag] || 0) + 1;
    }
  }

  return counts;
}

export function matchesQuery(item, query) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    (item.title || '').toLowerCase().includes(needle) ||
    (item.summary || '').toLowerCase().includes(needle) ||
    (item.url || '').toLowerCase().includes(needle) ||
    (item.tags || []).some((tag) => tag.toLowerCase().includes(needle))
  );
}

export function applyFilters(items, filters) {
  const { status = 'all', category = null, source = null, tag = null } = filters || {};

  return items.filter((item) => {
    if (status === 'starred' && !item.isFavorite) return false;
    if (category && item.category !== category) return false;
    if (source && item.source !== source) return false;
    if (tag && !(item.tags || []).includes(tag)) return false;
    return true;
  });
}
