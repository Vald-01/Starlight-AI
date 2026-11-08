import SourceIcon from '@/components/SourceIcon';
import CategoryChip from '@/components/CategoryChip';
import ItemMenu from '@/components/ItemMenu';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

export default function ItemCard({ item, onOpen, onStar, onCopy, onDelete, onOpenOriginal }) {
  const { language, t } = useLanguage();
  return (
    <article
      onClick={onOpen}
      className="group relative flex cursor-pointer flex-col rounded-xl border border-border/80 bg-card p-3.5 transition-all duration-200 hover:-translate-y-[1px] hover:border-border hover:shadow-[0_12px_28px_-22px_rgba(43,39,36,0.55)]"
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <SourceIcon source={item.source} size="sm" />
          <span className="tabular text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
            {relativeTime(item.createdAt, language)}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onStar(item);
            }}
              aria-label={t('toggleStar')}
            className={cn(
              'grid h-6 w-6 place-items-center rounded-md transition',
              item.isFavorite ? 'text-primary' : 'text-muted-foreground/50 hover:bg-muted hover:text-primary'
            )}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={item.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.2 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9L3.5 9.8l5.9-.8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <ItemMenu item={item} onOpen={onOpenOriginal} onCopy={onCopy} onStar={() => onStar(item)} onDelete={() => onDelete(item)}>
            <button
              type="button"
              onClick={(event) => event.stopPropagation()}
              aria-label={t('itemActions')}
              className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" />
              </svg>
            </button>
          </ItemMenu>
        </div>
      </div>

      <h3 className="mb-1.5 line-clamp-2 text-[13.5px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground">
        {item.title}
      </h3>
      <p className="mb-3 line-clamp-2 text-[11.5px] leading-[1.55] text-muted-foreground">{item.summary}</p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap gap-1">
          {(item.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-muted/70 px-1.5 py-[1px] text-[10px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
        <CategoryChip category={item.category} className="shrink-0" />
      </div>
    </article>
  );
}
