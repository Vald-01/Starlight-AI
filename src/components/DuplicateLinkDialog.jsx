import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';

export default function DuplicateLinkDialog({ open, link, onCancel, onConfirm }) {
  const { t } = useLanguage();

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-foreground/25 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[95] w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-[0_30px_80px_-40px_rgba(43,39,36,0.6)]">
          <Dialog.Title className="text-[14px] font-medium tracking-[-0.01em] text-foreground">
            {t('duplicateTitle')}
          </Dialog.Title>
          <Dialog.Description className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {t('duplicateQuestion')}
          </Dialog.Description>

          {link && (
            <div className="mt-3 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-2">
              <p className="truncate text-[12px] font-medium text-foreground">{link.title}</p>
              <p className="truncate text-[10.5px] text-muted-foreground">{link.normalizedUrl}</p>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-8 rounded-lg text-[12px]">
              {t('duplicateCancel')}
            </Button>
            <Button type="button" size="sm" onClick={onConfirm} className="h-8 rounded-lg text-[12px]">
              {t('duplicateAdd')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
