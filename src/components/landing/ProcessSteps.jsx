import { Check, Loader2 } from 'lucide-react';
import { PROCESSING_STAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

export default function ProcessSteps({ stage }) {
  const { t } = useLanguage();
  const stageKeys = ['stageUrl', 'stageContent', 'stageSummary', 'stageSave'];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {PROCESSING_STAGES.map((_, index) => {
        const label = t(stageKeys[index]);
        const done = index < stage;
        const current = index === stage;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors duration-300',
                done && 'border-border/80 bg-card text-muted-foreground',
                current && 'border-primary/35 bg-primary/[0.07] font-medium text-primary',
                !done && !current && 'border-border/50 bg-transparent text-muted-foreground/45'
              )}
            >
              {done ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : current ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-current" />
              )}
              {label}
            </span>
            {index < PROCESSING_STAGES.length - 1 && <span className="h-px w-3 bg-border sm:w-5" />}
          </div>
        );
      })}
    </div>
  );
}
