import { Copy, ExternalLink, Star, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/lib/i18n';

export default function ItemMenu({ item, onOpen, onCopy, onStar, onDelete, children }) {
  const { t } = useLanguage();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] rounded-xl">
        <DropdownMenuItem onClick={onOpen} className="gap-2 text-[12.5px]">
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} /> {t('openOriginal')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopy} className="gap-2 text-[12.5px]">
          <Copy className="h-3.5 w-3.5" strokeWidth={1.8} /> {t('copyLink')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onStar} className="gap-2 text-[12.5px]">
          <Star className="h-3.5 w-3.5" strokeWidth={1.8} />
          {item.isFavorite ? t('removeStar') : t('starItem')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="gap-2 text-[12.5px] text-destructive focus:text-destructive">
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} /> {t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
