import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ChevronDown, Mic, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { canUseAi, useAiConfig } from '@/lib/aiSettings';
import { cn } from '@/lib/utils';
import { toHttpUrl } from '@/lib/url';
import { useLanguage } from '@/lib/i18n';

export default function HeroComposer({ busy, onSubmit }) {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const ai = useAiConfig();
  const aiReady = canUseAi(ai);
  const [value, setValue] = useState('');
  const [mode, setMode] = useState(aiReady ? 'ai' : 'local');
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setMode(aiReady ? 'ai' : 'local');
  }, [aiReady]);

  const modes = [
    { id: 'local', label: t('modelLocal'), hint: t('modelHint') },
    ...(aiReady
      ? [{ id: 'ai', label: t('modelAi', { model: `${ai.provider.label} · ${ai.provider.modelLabel}` }), hint: ai.provider.model }]
      : []),
  ];
  const activeMode = modes.find((entry) => entry.id === mode) || modes[0];

  const submit = (event) => {
    event.preventDefault();
    const raw = value.trim();
    if (!raw || busy) return;

    const candidate = toHttpUrl(raw);
    if (!candidate) {
      toast({ description: t('invalidUrl'), variant: 'destructive' });
      return;
    }

    onSubmit(candidate, mode);
    setValue('');
  };

  const fillFromClipboard = async () => {
    try {
      const text = ((await navigator.clipboard.readText()) || '').trim().split(/\s+/)[0] || '';
      if (text) setValue(text);
    } catch {
      /* clipboard blocked — the user can paste manually */
    }
    inputRef.current?.focus();
  };

  const toggleVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      toast({ description: t('voiceUnsupported') });
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new Recognition();
    recognition.lang = language === 'fr' ? 'fr-FR' : 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event) => setValue(event.results[0][0].transcript);
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-[660px]">
      <div
        className={cn(
          'flex items-center gap-1 rounded-full border border-border bg-card p-1.5 pl-2 shadow-[0_16px_44px_-28px_rgba(43,39,36,0.5)] transition focus-within:border-primary/35 focus-within:shadow-[0_18px_50px_-26px_rgba(170,90,60,0.35)]',
          busy && 'opacity-70'
        )}
      >
        <button
          type="button"
          onClick={fillFromClipboard}
          aria-label={t('pasteClipboard')}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" strokeWidth={1.9} />
        </button>

        <input
          ref={inputRef}
          id="link-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={busy}
          aria-label={t('inputLabel')}
          placeholder={t('inputPlaceholder')}
          className="h-9 min-w-0 flex-1 bg-transparent px-1 text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none disabled:cursor-not-allowed"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hidden shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11.5px] text-muted-foreground transition hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              {activeMode.label}
              <ChevronDown className="h-3 w-3" strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[220px] rounded-xl">
            {modes.map((entry) => (
              <DropdownMenuItem
                key={entry.id}
                onClick={() => setMode(entry.id)}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <span className="text-[12.5px] font-medium">{entry.label}</span>
                <span className="w-full truncate text-[10.5px] text-muted-foreground">{entry.hint}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={toggleVoice}
          aria-label={listening ? t('stopListening') : t('dictate')}
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-full transition',
            listening ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Mic className="h-4 w-4" strokeWidth={1.8} />
        </button>

        <button
          type="submit"
          disabled={busy || !value.trim()}
          aria-label={t('processLink')}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground/60"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
    </form>
  );
}
