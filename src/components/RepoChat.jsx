import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Loader2, Send, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { askRepo, clearChat, getRepoChat, setChatDraft, subscribeRepoChat } from '@/lib/repoChat';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const ERROR_KEYS = {
  'invalid-key': 'repoChatErrorInvalidKey',
  timeout: 'repoChatErrorTimeout',
  network: 'repoChatErrorNetwork',
  model: 'repoChatErrorModel',
  quota: 'repoChatErrorQuota',
  overloaded: 'repoChatErrorOverloaded',
};

/** Scoped chat about one saved link; mounted only when an AI provider is configured. */
export default function RepoChat({ item }) {
  const { language, t } = useLanguage();
  const session = useSyncExternalStore(
    subscribeRepoChat,
    () => getRepoChat(item),
    () => getRepoChat(item)
  );
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const messageCount = session.messages.length;

  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messageCount, session.pending, session.error]);

  const submit = (event) => {
    event.preventDefault();
    if (session.pending || !session.draft.trim()) return;
    askRepo(item, session.draft, { language });
    inputRef.current?.focus();
  };

  return (
    <section aria-label={t('repoChatTitle')} className="shrink-0 border-t border-border/70 bg-background px-5 py-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" strokeWidth={2} />
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
            {t('repoChatTitle')}
          </h4>
        </div>
        {messageCount > 0 && (
          <button
            type="button"
            onClick={() => clearChat(item)}
            aria-label={t('repoChatClear')}
            title={t('repoChatClear')}
            className="grid h-5 w-5 place-items-center rounded-md text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-3 w-3" strokeWidth={1.9} />
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card/60">
        <div ref={listRef} className="vault-scroll max-h-[186px] min-h-[96px] space-y-2 overflow-y-auto px-3 py-2.5">
          {messageCount === 0 ? (
            <p className="text-[11.5px] leading-[1.55] text-muted-foreground/80">{t('repoChatEmpty')}</p>
          ) : (
            session.messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <p
                  className={cn(
                    'max-w-[86%] whitespace-pre-wrap rounded-lg px-2.5 py-1.5 text-[11.5px] leading-[1.5]',
                    message.role === 'user' ? 'bg-primary/12 text-foreground' : 'bg-muted/70 text-foreground/90'
                  )}
                >
                  {message.content}
                </p>
              </div>
            ))
          )}

          {session.pending && (
            <p role="status" className="tabular flex items-center gap-1.5 text-[10.5px] text-muted-foreground/70">
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
              {t('repoChatThinking')}
            </p>
          )}
          {session.error && (
            <p className="text-[10.5px] leading-relaxed text-destructive">
              {t(ERROR_KEYS[session.error] || 'repoChatErrorGeneral')}
              {session.errorDetail && (
                <span className="mt-0.5 block break-words select-text text-[10px] text-muted-foreground/80">
                  {session.errorDetail}
                </span>
              )}
            </p>
          )}
        </div>

        <form onSubmit={submit} className="flex items-center gap-1.5 border-t border-border/70 bg-background/70 p-1.5">
          <input
            ref={inputRef}
            value={session.draft}
            onChange={(event) => setChatDraft(item, event.target.value)}
            placeholder={t('repoChatPlaceholder')}
            aria-label={t('repoChatPlaceholder')}
            disabled={session.pending}
            className="h-8 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-60"
          />
          <Button
            type="submit"
            size="icon"
            disabled={session.pending || !session.draft.trim()}
            aria-label={t('repoChatSend')}
            title={t('repoChatSend')}
            className="h-7 w-7 shrink-0 rounded-lg"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        </form>
      </div>

      <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground/60">{t('repoChatScope')}</p>
    </section>
  );
}
