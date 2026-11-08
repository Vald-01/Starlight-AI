import { Copy, ExternalLink, Star, Tag, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import SourceIcon from '@/components/SourceIcon';
import CategoryChip from '@/components/CategoryChip';
import { sourceMeta } from '@/lib/constants';
import { formatCount, hostOf, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { isHttpUrl } from '@/lib/url';
import { useLanguage } from '@/lib/i18n';

function Section({ icon: Icon, title, children }) {
  return (
    <section className="border-t border-border/70 px-5 py-4">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-primary" strokeWidth={2} />
        <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">{title}</h4>
      </div>
      {children}
    </section>
  );
}

export default function ItemDrawer({ item, open, onOpenChange, onStar, onDelete, onCopy }) {
  const { language, t } = useLanguage();
  if (!item) return null;
  const source = sourceMeta(item.source);
  // Stored links may come from an older import: never hand a non-http href to the webview.
  const openable = isHttpUrl(item.url);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="vault-scroll w-full overflow-y-auto border-l border-border bg-background p-0 sm:max-w-[540px]">
        <SheetTitle className="sr-only">{item.title}</SheetTitle>

        <div className="px-5 pb-4 pt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SourceIcon source={item.source} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">
                  {source.label}
                </p>
                <p className="tabular text-[10.5px] text-muted-foreground/70">
                  {t('saved')} {relativeTime(item.createdAt, language)}
                </p>
              </div>
            </div>
            <CategoryChip category={item.category} />
          </div>

          <h2 className="mb-2 pr-6 text-[19px] font-semibold leading-[1.25] tracking-[-0.02em] text-foreground">
            {item.title}
          </h2>

          <a
            href={openable ? item.url : undefined}
            aria-disabled={!openable}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'inline-flex max-w-full items-center gap-1.5 text-[11.5px] text-muted-foreground transition hover:text-primary',
              !openable && 'pointer-events-none opacity-60'
            )}
          >
            <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={1.9} />
            <span className="truncate">{hostOf(item.url)}{item.url.replace(/^https?:\/\/[^/]+/, '')}</span>
          </a>
        </div>

        {item.summary && (
          <div className="px-5">
            <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3.5">
              <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-primary/80">{t('aiSummary')}</p>
              <p className="text-[12.5px] leading-[1.6] text-foreground/90">{item.summary}</p>
            </div>
          </div>
        )}

        {item.source === 'github' && (
          <Section icon={Star} title={t('repositorySignal')}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="tabular inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11.5px] font-medium text-foreground">
                <Star className="h-3 w-3 text-primary" strokeWidth={2} />
                {formatCount(item.stats?.stars || 0)} {t('stars')}
              </span>
              {item.stats?.language && (
                <span className="rounded-md bg-muted px-2 py-1 text-[11.5px] font-medium text-foreground">
                  {item.stats.language}
                </span>
              )}
            </div>
          </Section>
        )}

        {(item.tags || []).length > 0 && (
          <Section icon={Tag} title={t('tags')}>
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-[2px] text-[10.5px] text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        <div className="sticky bottom-0 flex items-center gap-2 border-t border-border/70 bg-background/95 px-5 py-3 backdrop-blur">
          <Button asChild size="sm" className="h-8 flex-1 gap-1.5 rounded-lg text-[12px]">
            <a href={openable ? item.url : undefined} aria-disabled={!openable} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} /> {t('openOriginal')}
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onCopy(item.url)} className="h-8 gap-1.5 rounded-lg text-[12px]">
            <Copy className="h-3.5 w-3.5" strokeWidth={1.9} /> {t('copy')}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onStar(item)}
            aria-label={t('toggleStar')}
            className={cn('h-8 w-8 rounded-lg', item.isFavorite && 'text-primary')}
          >
            <Star className={cn('h-3.5 w-3.5', item.isFavorite && 'fill-primary')} strokeWidth={1.9} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(item)}
            aria-label={t('deleteItem')}
            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.9} />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
