import { Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import logoLight from '@/assets/brand/starlight-logo.svg';
import logoDark from '@/assets/brand/starlight-logo-dark.svg';
import logoMark from '@/assets/brand/starlight-icon.png';
import { openSettings } from '@/lib/settingsModal';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

export default function AppHeader() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const active = pathname.startsWith('/vault') ? '/vault' : '/';

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto grid max-w-[1180px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3">
        <Link
          to="/"
          aria-label="Starlight"
          className="flex items-center justify-self-start rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <img src={logoMark} alt="" aria-hidden="true" className="h-7 w-7 sm:hidden" />
          <span className="hidden sm:block">
            <span className="dark:hidden">
              <img src={logoLight} alt="Starlight" className="h-[22px] w-auto" />
            </span>
            <span className="hidden dark:block">
              <img src={logoDark} alt="" aria-hidden="true" className="h-[22px] w-auto" />
            </span>
          </span>
        </Link>

        <nav
          aria-label={t('switchView')}
          className="flex items-center gap-0.5 justify-self-center rounded-full border border-border/80 bg-muted/70 p-[3px]"
        >
          {[{ to: '/', key: 'home' }, { to: '/vault', key: 'vault' }].map((view) => {
            const isActive = active === view.to;
            return (
              <Link
                key={view.to}
                to={view.to}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3.5 py-1 text-[12px] font-medium transition-colors sm:px-4',
                  isActive
                    ? 'bg-card text-foreground shadow-[0_1px_2px_rgba(43,39,36,0.14)]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t(view.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-self-end gap-1.5">
          <button
            type="button"
            onClick={() => openSettings('general')}
            aria-label={t('settings')}
            title={`${t('settings')} (⌘,)`}
            className="grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-card/70 text-muted-foreground transition hover:border-border hover:text-foreground"
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </header>
  );
}
