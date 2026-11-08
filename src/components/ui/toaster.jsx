import { useToast } from './use-toast';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map(({ id, title, description, variant, open, duration }) => (
        <div
          key={id}
          role="status"
          className={cn(
            'pointer-events-auto overflow-hidden rounded-xl border bg-card shadow-[0_18px_44px_-30px_rgba(43,39,36,0.7)] transition-all duration-200 ease-out',
            open ? 'translate-y-0 opacity-100' : 'translate-y-1.5 opacity-0',
            variant === 'destructive' ? 'border-destructive/40 text-destructive' : 'border-border text-foreground'
          )}
        >
          <div className="px-4 py-3 text-sm">
            {title && <p className="font-medium">{title}</p>}
            {description && <p className={title ? 'mt-1 text-muted-foreground' : ''}>{description}</p>}
          </div>
          <div className="h-[2px] w-full bg-primary/15" aria-hidden="true">
            <div
              key={`${id}-bar`}
              className="h-full origin-left bg-primary"
              style={{ animation: `toast-progress ${duration ?? 4000}ms linear forwards` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
