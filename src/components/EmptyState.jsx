import { Archive, RotateCcw, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';

export default function EmptyState({ variant = 'empty', onReset, actionLabel }) {
  const { t } = useLanguage();
  const copy = variant === 'search'
    ? { title: t('emptySearchTitle'), body: t('emptySearchBody') }
    : variant === 'filter'
      ? { title: t('emptyFilterTitle'), body: t('emptyFilterBody') }
      : { title: t('emptyTitle'), body: t('emptyBody') };
  const Icon = variant === 'search' ? SearchX : Archive;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/90 bg-card/50 px-6 py-16 text-center">
      <div className="relative mb-5 grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 rounded-2xl bg-primary/10" />
        <span className="absolute inset-2 rounded-xl border border-primary/25" />
        <Icon className="relative h-5 w-5 text-primary" strokeWidth={1.5} />
        <svg viewBox="0 0 120 40" className="absolute -bottom-3 left-1/2 h-6 w-24 -translate-x-1/2 text-primary/25" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M4 28c14-16 26 4 40-8s26 8 40-6 22 6 32 2" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="mb-1 text-[14px] font-medium tracking-[-0.01em] text-foreground">{copy.title}</h3>
      <p className="mb-4 max-w-[320px] text-[12px] leading-relaxed text-muted-foreground">{copy.body}</p>
      {onReset && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="h-7 gap-1.5 rounded-lg border-border/90 text-[11.5px] font-medium"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={2} /> {actionLabel || t('resetFilters')}
        </Button>
      )}
    </div>
  );
}
