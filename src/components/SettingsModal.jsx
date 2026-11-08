import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Check, ExternalLink, KeyRound, Monitor, Moon, Palette, PlugZap, RotateCw, Settings2, Sparkles, Sun, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import ProviderLogo from '@/components/ProviderLogo';
import { useToast } from '@/components/ui/use-toast';
import {
  AI_PROVIDERS,
  PROVIDER_ORDER,
  canUseAi,
  clearAiConfig,
  detectOllama,
  keyForProvider,
  maskApiKey,
  saveAiConfig,
  useAiConfig,
} from '@/lib/aiSettings';
import { probeAi } from '@/lib/aiClient';
import { isTauri, openExternal } from '@/lib/openExternal';
import { writePref } from '@/lib/prefs';
import { closeSettings, setSettingsTab, useSettingsModal } from '@/lib/settingsModal';
import { useTheme } from '@/lib/useTheme';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'general', labelKey: 'settingsGeneral', icon: Settings2 },
  { id: 'ai', labelKey: 'settingsAi', icon: KeyRound },
  { id: 'appearance', labelKey: 'settingsAppearance', icon: Palette },
];

const THEME_OPTIONS = [
  { id: 'light', labelKey: 'themeLight', hintKey: 'themeLightHint', icon: Sun, swatch: '#FBF9F5' },
  { id: 'dark', labelKey: 'themeDark', hintKey: 'themeDarkHint', icon: Moon, swatch: '#1B1B1D' },
  { id: 'system', labelKey: 'themeSystem', hintKey: 'themeSystemHint', icon: Monitor, swatch: null },
];

function Section({ title, children }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">{title}</h3>
      <div className="rounded-xl border border-border/80 bg-background/60 px-3.5">{children}</div>
    </section>
  );
}

function Row({ title, body, children }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border/60 py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium text-foreground">{title}</p>
        {body && <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{body}</p>}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

function useAutoStart() {
  const [state, setState] = useState({ supported: isTauri(), enabled: false, busy: true });

  useEffect(() => {
    if (!state.supported) {
      setState((current) => ({ ...current, busy: false }));
      return undefined;
    }
    let alive = true;
    (async () => {
      try {
        const autostart = await import('@tauri-apps/plugin-autostart');
        const enabled = await autostart.isEnabled();
        if (!alive) return;
        writePref('autostart', enabled ? 'true' : 'false');
        setState({ supported: true, enabled, busy: false });
      } catch {
        if (alive) setState({ supported: false, enabled: false, busy: false });
      }
    })();
    return () => {
      alive = false;
    };
  }, [state.supported]);

  const setEnabled = useCallback(async (next) => {
    setState((current) => ({ ...current, busy: true }));
    try {
      const autostart = await import('@tauri-apps/plugin-autostart');
      await (next ? autostart.enable() : autostart.disable());
      writePref('autostart', next ? 'true' : 'false');
      setState({ supported: true, enabled: next, busy: false });
      return true;
    } catch {
      setState((current) => ({ ...current, busy: false }));
      return false;
    }
  }, []);

  return { ...state, setEnabled };
}

function GeneralPanel() {
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const autostart = useAutoStart();

  const toggleAutoStart = async (next) => {
    const ok = await autostart.setEnabled(next);
    if (!ok) toast({ description: t('settingsLaunchUnavailable'), variant: 'destructive' });
  };

  return (
    <div>
      <Section title={t('settingsLaunchTitle')}>
        <Row
          title={t('settingsLaunchLabel')}
          body={autostart.supported ? t('settingsLaunchBody') : `${t('settingsLaunchBody')} ${t('settingsLaunchUnavailable')}`}
        >
          <Switch
            checked={autostart.enabled}
            disabled={!autostart.supported || autostart.busy}
            onCheckedChange={toggleAutoStart}
            aria-label={t('settingsLaunchLabel')}
          />
        </Row>
      </Section>

      <Section title={t('settingsLanguageTitle')}>
        <Row title={t('settingsLanguageTitle')} body={t('settingsLanguageBody')}>
          <div className="inline-flex rounded-lg border border-border/80 bg-muted p-0.5">
            {[
              ['fr', 'Français (FR)'],
              ['en', 'English (EN)'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setLanguage(id)}
                aria-pressed={language === id}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[11.5px] font-medium transition',
                  language === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>
      </Section>
    </div>
  );
}

function AiPanel() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const config = useAiConfig();
  const active = canUseAi(config);
  const [provider, setProvider] = useState(config.provider.id);
  const [key, setKey] = useState(config.key);
  const [ollama, setOllama] = useState({ checking: true, running: false, models: [] });
  const [test, setTest] = useState({ state: 'idle' });

  const selected = AI_PROVIDERS[provider];

  const checkOllama = useCallback(async () => {
    setOllama((current) => ({ ...current, checking: true }));
    const result = await detectOllama();
    setOllama({ checking: false, ...result });
  }, []);

  useEffect(() => {
    if (config.provider.id === 'ollama' || provider === 'ollama') checkOllama();
  }, [config.provider.id, provider, checkOllama]);

  const selectProvider = (id) => {
    setProvider(id);
    setKey(keyForProvider(id));
    setTest({ state: 'idle' });
    if (!AI_PROVIDERS[id].requiresKey) checkOllama();
  };

  const submit = (event) => {
    event.preventDefault();
    const value = key.trim();
    if (selected.requiresKey && !value) {
      toast({ description: t('aiKeyRequired') });
      return;
    }
    saveAiConfig({ provider, key: value });
    toast({ description: t('aiKeySaved') });
  };

  const disconnect = () => {
    clearAiConfig();
    setKey('');
    setTest({ state: 'idle' });
    toast({ description: t('aiKeyRemoved') });
  };

  const runTest = async () => {
    setTest({ state: 'testing' });
    const result = await probeAi({ provider: selected, key: key.trim() });
    setTest(result.ok ? { state: 'ok', latency: result.latency } : { state: 'fail', message: result.message });
  };

  const testDisabled = test.state === 'testing' || (selected.requiresKey && !key.trim());

  return (
    <form onSubmit={submit}>
      <div className="rounded-xl border border-border/80 bg-muted/40 p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
            {t('aiStatusTitle')}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-medium',
              active
                ? 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:text-emerald-300'
                : 'border-sky-600/25 bg-sky-500/10 text-sky-700 dark:border-sky-400/25 dark:text-sky-300'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-sky-500')} />
            {active ? t('aiStatusConnected') : t('aiStatusNative')}
          </span>
        </div>
        {active ? (
          <>
            <p className="mt-2 text-[12.5px] text-foreground">
              {t('aiActiveProvider', { provider: `${config.provider.label} (${config.provider.modelLabel})` })}
            </p>
            {config.provider.requiresKey && config.key ? (
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{maskApiKey(config.key)}</p>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">{t('ollamaHint')}</p>
            )}
          </>
        ) : (
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{t('aiStatusNativeBody')}</p>
        )}
      </div>

      <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
        {t('aiProviderSection')}
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        {PROVIDER_ORDER.map((id) => {
          const entry = AI_PROVIDERS[id];
          const isActive = provider === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectProvider(id)}
              aria-pressed={isActive}
              title={`${entry.label} · ${entry.modelLabel}`}
              className={cn(
                'group relative flex h-[96px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 transition',
                isActive
                  ? 'border-amber-600 bg-amber-50/50 shadow-sm dark:border-amber-500/70 dark:bg-amber-500/10'
                  : 'border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-600 dark:hover:bg-stone-800'
              )}
            >
              {isActive && (
                <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-amber-600 text-white">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
              <ProviderLogo provider={id} className="h-9 w-9" />
              <span
                className={cn(
                  'text-[10.5px] font-medium leading-tight',
                  isActive ? 'text-amber-800 dark:text-amber-300' : 'text-stone-600 dark:text-stone-300'
                )}
              >
                {entry.label}
              </span>
              {id === 'ollama' ? (
                ollama.running ? (
                  <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                ) : null
              ) : entry.badge === 'recommended' ? (
                <span className="absolute bottom-1.5 text-[8px] font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-400">
                  {t('aiRecommended')}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selected.requiresKey ? (
        <div className="mt-4">
          <label htmlFor="settings-ai-key" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
            {t('aiApiKey')}
          </label>
          <input
            id="settings-ai-key"
            type="password"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder={selected.keyPlaceholder || t('aiApiKeyPlaceholder')}
            autoComplete="off"
            spellCheck={false}
            className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono text-[12px] text-foreground placeholder:font-body placeholder:text-muted-foreground/60 focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/12"
          />
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground/80">{t('aiKeyHint')}</p>
          <button
            type="button"
            onClick={() => openExternal(selected.consoleUrl)}
            className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-medium text-primary underline decoration-primary/30 underline-offset-2 transition hover:decoration-primary"
          >
            {t('aiGetKey', { provider: selected.label })}
            <ExternalLink className="h-2.5 w-2.5" strokeWidth={2.2} />
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-border/80 bg-muted/40 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-foreground">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  ollama.checking ? 'animate-pulse bg-muted-foreground' : ollama.running ? 'bg-emerald-500' : 'bg-destructive'
                )}
              />
              {ollama.checking ? t('ollamaChecking') : ollama.running ? t('ollamaDetected') : t('ollamaMissing')}
            </span>
            <button
              type="button"
              onClick={checkOllama}
              aria-label={t('ollamaRecheck')}
              title={t('ollamaRecheck')}
              className="grid h-5 w-5 place-items-center rounded text-muted-foreground transition hover:bg-background hover:text-foreground"
            >
              <RotateCw className={cn('h-2.5 w-2.5', ollama.checking && 'animate-spin')} strokeWidth={2.2} />
            </button>
          </div>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground/80">{t('ollamaHint')}</p>
        </div>
      )}

      <div className="mt-3 min-h-[18px]">
        {test.state === 'testing' && <p className="text-[11px] text-muted-foreground">{t('aiTesting')}</p>}
        {test.state === 'ok' && (
          <p className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" strokeWidth={2.5} />
            {t('aiTestOk', { ms: test.latency })}
          </p>
        )}
        {test.state === 'fail' && <p className="text-[11px] text-destructive">{t('aiTestFail', { message: test.message || '' })}</p>}
        {test.state === 'idle' && <p className="text-[10.5px] text-muted-foreground/70">{t('aiTestHint')}</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={runTest}
            disabled={testDisabled}
            className="h-8 rounded-lg text-[12px]"
          >
            <PlugZap className="h-3.5 w-3.5" strokeWidth={1.9} />
            {t('aiTestConnection')}
          </Button>
          {config.key && config.provider.id === provider && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="h-8 rounded-lg text-[12px] text-destructive hover:text-destructive"
            >
              {t('aiDisconnect')}
            </Button>
          )}
        </div>
        <Button type="submit" size="sm" className="h-8 rounded-lg text-[12px]">
          {t('aiSaveKey')}
        </Button>
      </div>
    </form>
  );
}

function AppearancePanel() {
  const { t } = useLanguage();
  const { mode, setTheme } = useTheme();

  return (
    <div>
      <Section title={t('settingsAppearanceTitle')}>
        <Row title={t('settingsAppearanceTitle')} body={t('settingsAppearanceBody')}>
          <span className="text-[11px] text-muted-foreground">
            {mode === 'system' ? t('themeSystem') : mode === 'dark' ? t('themeDark') : t('themeLight')}
          </span>
        </Row>
      </Section>

      <div className="grid grid-cols-3 gap-2.5">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = mode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              aria-pressed={selected}
              className={cn(
                'relative flex h-[112px] flex-col items-center justify-center gap-2 rounded-xl border px-2 transition',
                selected
                  ? 'border-amber-600 bg-amber-50/50 shadow-sm dark:border-amber-500/70 dark:bg-amber-500/10'
                  : 'border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-600 dark:hover:bg-stone-800'
              )}
            >
              {selected && (
                <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-amber-600 text-white">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
              <span
                className={cn(
                  'grid h-9 w-14 place-items-center rounded-md border border-black/10',
                  selected ? 'ring-1 ring-amber-600/30' : ''
                )}
                style={
                  option.swatch
                    ? { background: option.swatch }
                    : { background: 'linear-gradient(115deg, #FBF9F5 0 50%, #1B1B1D 50% 100%)' }
                }
              >
                <Icon
                  className={cn('h-3.5 w-3.5', option.id === 'dark' ? 'text-stone-200' : option.id === 'light' ? 'text-stone-500' : 'text-stone-400')}
                  strokeWidth={1.9}
                />
              </span>
              <span className="text-[10.5px] font-medium leading-tight text-foreground">{t(option.labelKey)}</span>
              <span className="text-[9.5px] leading-tight text-muted-foreground/80">{t(option.hintKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsModal() {
  const { open, tab } = useSettingsModal();
  const { t } = useLanguage();

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? setSettingsTab(tab) : closeSettings())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[95] bg-foreground/25 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[96] grid h-[min(560px,calc(100vh-2rem))] w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 grid-cols-[178px_1fr] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_40px_100px_-50px_rgba(43,39,36,0.65)]">
          <div className="flex min-h-0 flex-col border-r border-border/80 bg-muted/40 p-2.5">
            <Dialog.Title className="px-2 pb-2 pt-1 text-[12.5px] font-semibold tracking-[-0.01em] text-foreground">
              {t('settings')}
            </Dialog.Title>
            <Dialog.Description className="sr-only">{t('settings')}</Dialog.Description>
            <nav className="flex flex-col gap-0.5">
              {TABS.map((entry) => {
                const Icon = entry.icon;
                const selected = tab === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSettingsTab(entry.id)}
                    aria-current={selected ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition',
                      selected
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
                    <span className="truncate">{t(entry.labelKey)}</span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted-foreground/60">
              <Sparkles className="h-3 w-3 text-primary/70" strokeWidth={2} />
              Starlight
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5">
              <p className="text-[12.5px] font-medium text-foreground">{t(TABS.find((entry) => entry.id === tab)?.labelKey || 'settings')}</p>
              <button
                type="button"
                onClick={closeSettings}
                aria-label={t('close')}
                className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
            <div className="vault-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {tab === 'general' && <GeneralPanel />}
              {tab === 'ai' && <AiPanel />}
              {tab === 'appearance' && <AppearancePanel />}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
