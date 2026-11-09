import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AiModeBanner from '@/components/landing/AiModeBanner';
import ItemGrid from '@/components/ItemGrid';
import ItemDrawer from '@/components/ItemDrawer';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/ui/use-toast';
import { useLinks } from '@/hooks/useLinks';
import { matchesQuery } from '@/lib/filterLinks';
import { VAULT_TABS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { isHttpUrl } from '@/lib/url';
import { openExternal } from '@/lib/openExternal';
import { useLanguage } from '@/lib/i18n';
import { shortcutLabel } from '@/lib/platform';

const matchesTab = (item, tab) => {
  if (tab === 'all') return true;
  if (tab === 'starred') return item.isFavorite;
  return item.source === tab;
};

export default function Vault() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { items, loading, patchLink, removeLink } = useLinks();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchRef = useRef(null);

  const saved = useMemo(() => items, [items]);

  const counts = useMemo(
    () =>
      VAULT_TABS.reduce((acc, entry) => {
        acc[entry.id] = saved.filter((item) => matchesTab(item, entry.id)).length;
        return acc;
      }, {}),
    [saved]
  );

  const visible = useMemo(
    () => saved.filter((item) => matchesTab(item, tab) && matchesQuery(item, query)),
    [saved, tab, query]
  );

  const activeItem = useMemo(() => items.find((item) => item.id === activeId) ?? null, [items, activeId]);

  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const openItem = (item) => {
    setActiveId(item.id);
    setDrawerOpen(true);
  };

  const toggleStar = (item) => {
    patchLink(item.id, { isFavorite: !item.isFavorite });
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ description: t('copied') });
    } catch {
      toast({ description: t('copyError'), variant: 'destructive' });
    }
  };

  const deleteItem = async (item) => {
    if (activeId === item.id) setDrawerOpen(false);
    await removeLink(item.id);
    toast({ description: t('deleted', { title: item.title }) });
  };

  const filtered = Boolean(query) || tab !== 'all';

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
        <div className="flex flex-col gap-5 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-[24px] font-semibold tracking-[-0.025em] text-foreground">{t('vault')}</h1>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {saved.length} {saved.length === 1 ? t('savedLink') : t('savedLinks')}
              {counts.starred ? ` · ${counts.starred} ${counts.starred === 1 ? t('favorite') : t('favorites')}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-[300px] sm:flex-none">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.9}
              />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('searchVault')}
                aria-label={t('searchLinks')}
                className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-14 text-[12.5px] text-foreground placeholder:text-muted-foreground/70 focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/12"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[5px] border border-border bg-background px-1 py-[1px] font-mono text-[9.5px] text-muted-foreground">
                {shortcutLabel('K')}
              </kbd>
            </div>

            <Link
              to="/"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[12px] font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
              <span className="hidden sm:inline">{t('addLink')}</span>
            </Link>
          </div>
        </div>

        <AiModeBanner className="mt-3 flex justify-start" />

        <div className="vault-scroll mt-4 flex items-center gap-1 overflow-x-auto pb-1">
          {VAULT_TABS.map((entry) => {
            const isActive = tab === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                aria-pressed={isActive}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-colors',
                  isActive
                    ? 'bg-foreground font-medium text-background'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {t(({ all: 'tabAll', github: 'tabGithub', instagram: 'tabInstagram', web: 'tabWeb', starred: 'tabStarred' })[entry.id])}
                <span
                  className={cn(
                    'tabular text-[10px]',
                    isActive ? 'text-background/60' : 'text-muted-foreground/60'
                  )}
                >
                  {counts[entry.id] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((key) => (
                <div key={key} className="h-[152px] animate-pulse rounded-xl border border-border/70 bg-card/60" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              variant={query ? 'search' : filtered ? 'filter' : 'empty'}
              onReset={
                query
                  ? () => setQuery('')
                  : filtered
                    ? () => setTab('all')
                    : undefined
              }
                actionLabel={query ? t('clearSearch') : filtered ? t('showAll') : undefined}
            />
          ) : (
            <ItemGrid
              items={visible}
              onOpen={openItem}
              onStar={toggleStar}
              onCopy={(item) => copyText(item.url)}
              onDelete={deleteItem}
              onOpenOriginal={(item) => {
                if (isHttpUrl(item.url)) openExternal(item.url);
                else toast({ description: t('invalidUrl'), variant: 'destructive' });
              }}
            />
          )}
        </div>
      </main>

      <ItemDrawer
        item={activeItem}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStar={toggleStar}
        onDelete={deleteItem}
        onCopy={(value) => copyText(value)}
      />
    </div>
  );
}
