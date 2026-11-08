import { useCallback, useEffect, useRef, useState } from 'react';
import { buildLink, createId, migrateLink } from '@/lib/types';

const STORAGE_KEY = 'linkvault.links.v1';

function readLinks() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .map((entry) => migrateLink(entry))
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    return [];
  }
}

function writeLinks(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage is optional */
  }
}

export function useLinks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const itemsRef = useRef([]);

  useEffect(() => {
    const stored = readLinks();
    itemsRef.current = stored;
    setItems(stored);
    writeLinks(stored);
    setLoading(false);
  }, []);

  const updateItems = useCallback((updater) => {
    setItems((current) => {
      const next = updater(current);
      itemsRef.current = next;
      writeLinks(next);
      return next;
    });
  }, []);

  /**
   * Inserts a link unless its normalizedUrl is already in the vault.
   * Returns { duplicate: true, existing } so the caller can ask the user before forcing it.
   */
  const addLink = useCallback(async (draft, { force = false } = {}) => {
    const link = buildLink(draft);
    const existing = itemsRef.current.find((item) => item.normalizedUrl === link.normalizedUrl) || null;
    if (existing && !force) return { duplicate: true, existing };
    const created = { ...link, id: createId(), createdAt: new Date().toISOString() };
    updateItems((current) => [created, ...current]);
    return { duplicate: false, item: created };
  }, [updateItems]);

  const patchLink = useCallback(async (id, patch) => {
    updateItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, [updateItems]);

  const removeLink = useCallback(async (id) => {
    updateItems((current) => current.filter((item) => item.id !== id));
  }, [updateItems]);

  const patchMany = useCallback(async (ids, patch) => {
    updateItems((current) => current.map((item) => (ids.includes(item.id) ? { ...item, ...patch } : item)));
  }, [updateItems]);

  const addTagsToMany = useCallback(async (ids, tags) => {
    updateItems((current) => current.map((item) => ids.includes(item.id)
      ? { ...item, tags: Array.from(new Set([...(item.tags || []), ...tags])) }
      : item));
  }, [updateItems]);

  const removeMany = useCallback(async (ids) => {
    updateItems((current) => current.filter((item) => !ids.includes(item.id)));
  }, [updateItems]);

  return { items, loading, addLink, patchLink, removeLink, patchMany, addTagsToMany, removeMany };
}
