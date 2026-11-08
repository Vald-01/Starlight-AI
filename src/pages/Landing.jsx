import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AiModeBanner from '@/components/landing/AiModeBanner';
import DuplicateLinkDialog from '@/components/DuplicateLinkDialog';
import HeroComposer from '@/components/landing/HeroComposer';
import ProcessSteps from '@/components/landing/ProcessSteps';
import { useToast } from '@/components/ui/use-toast';
import { useLinks } from '@/hooks/useLinks';
import { enrichLink } from '@/lib/enrichLink';
import { toHttpUrl } from '@/lib/url';
import { categoryLabel } from '@/lib/constants';
import { useLanguage } from '@/lib/i18n';

const STAGE_INDEX = { url: 0, content: 1, summary: 2, save: 3 };
const CATEGORY_KEYS = {
  github: 'categoryGithub',
  instagram: 'categoryInstagram',
  article: 'categoryArticle',
  code: 'categoryCode',
};

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { addLink } = useLinks();
  const [stage, setStage] = useState(-1);
  const [duplicate, setDuplicate] = useState(null);

  const announce = (item) => {
    toast({
      description: t('added', {
        title: item.title,
        category: CATEGORY_KEYS[item.category] ? t(CATEGORY_KEYS[item.category]) : categoryLabel(item.category),
      }),
    });
    navigate('/vault');
  };

  const handleProcess = async (url, mode) => {
    const candidate = toHttpUrl(url);
    if (!candidate) {
      toast({ description: t('invalidUrl'), variant: 'destructive' });
      return;
    }
    setStage(STAGE_INDEX.url);
    try {
      const draft = await enrichLink(candidate, {
        mode,
        language,
        onStage: (key) => setStage(STAGE_INDEX[key] ?? STAGE_INDEX.url),
        onAiError: (reason) => {
          if (reason === 'invalid-key') toast({ description: t('aiFallbackInvalidKey') });
        },
      });
      setStage(STAGE_INDEX.save);
      const result = await addLink(draft);
      setStage(-1);
      if (result.duplicate) {
        setDuplicate(draft);
        return;
      }
      announce(result.item);
    } catch (error) {
      setStage(-1);
      toast({
        description: error?.code === 'invalid-url' ? t('invalidUrl') : t('processError'),
        variant: 'destructive',
      });
    }
  };

  const addDuplicateAnyway = async () => {
    const draft = duplicate;
    setDuplicate(null);
    if (!draft) return;
    const result = await addLink(draft, { force: true });
    if (!result.duplicate) announce(result.item);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-[880px] flex-1 flex-col items-center justify-center px-5 pb-20 pt-14 text-center sm:pt-20">
        <span className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/70 px-3 py-1 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" strokeWidth={2} />
          {t('landingBadge')}
        </span>

        <h1 className="max-w-[17ch] font-heading text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-[54px]">
          {t('landingTitle')}
        </h1>

        <p className="mt-5 max-w-[48ch] text-[13.5px] leading-[1.75] text-muted-foreground sm:text-[15px]">
          {t('landingDescription')}
        </p>

        <div className="mt-9 w-full">
          <HeroComposer busy={stage >= 0} onSubmit={handleProcess} />
          <AiModeBanner className="mt-3" />
        </div>

        {stage >= 0 && (
          <div className="mt-5 flex min-h-[30px] items-center justify-center">
            <ProcessSteps stage={stage} />
          </div>
        )}
      </main>

      <DuplicateLinkDialog
        open={Boolean(duplicate)}
        link={duplicate}
        onCancel={() => setDuplicate(null)}
        onConfirm={addDuplicateAnyway}
      />
    </div>
  );
}
