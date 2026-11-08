import { Badge } from '@/components/ui/badge';
import { categoryLabel } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

export default function CategoryChip({ category, className }) {
  const { t } = useLanguage();
  const categoryKeys = { all: 'categoryAll', github: 'categoryGithub', instagram: 'categoryInstagram', article: 'categoryArticle', code: 'categoryCode' };
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full border-border/80 bg-muted/50 px-1.5 py-0 text-[10px] font-medium tracking-tight text-muted-foreground',
        className
      )}
    >
      {categoryKeys[category] ? t(categoryKeys[category]) : categoryLabel(category)}
    </Badge>
  );
}
