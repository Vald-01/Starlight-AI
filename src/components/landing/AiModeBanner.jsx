import { Settings, Sparkles } from 'lucide-react';
import { canUseAi, useAiConfig } from '@/lib/aiSettings';
import { openSettings } from '@/lib/settingsModal';
import { useLanguage } from '@/lib/i18n';

export default function AiModeBanner({ className }) {
  const { t } = useLanguage();
  const config = useAiConfig();
  const active = canUseAi(config);

  return (
    <div className={className}>
      {active ? (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/25 bg-emerald-500/10 px-2.5 py-1 text-[10.5px] font-medium text-emerald-700 dark:border-emerald-400/25 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('aiModeActive', { provider: `${config.provider.label} / ${config.provider.modelLabel}` })}
          </span>
          <button
            type="button"
            onClick={() => openSettings('ai')}
            aria-label={t('settings')}
            title={t('settings')}
            className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={1.9} />
          </button>
        </div>
      ) : (
        <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[11px] leading-relaxed text-muted-foreground/80">
          <Sparkles className="h-3 w-3 shrink-0 text-primary/70" strokeWidth={2} />
          <span>{t('aiBannerFast')}</span>
          <button
            type="button"
            onClick={() => openSettings('ai')}
            className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition hover:decoration-primary"
          >
            {t('aiBannerAddKey')}
          </button>
          <span>{t('aiBannerAddKeySuffix')}</span>
        </p>
      )}
    </div>
  );
}
