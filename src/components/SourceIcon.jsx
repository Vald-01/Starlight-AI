import { Globe, Github, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAP = {
  instagram: {
    Icon: Instagram,
    className: 'bg-[#F4E5EE] text-[#A6417C] dark:bg-[#31212B] dark:text-[#E1A3C5]',
  },
  github: {
    Icon: Github,
    className: 'bg-[#EAE7E2] text-[#3B3733] dark:bg-[#26262B] dark:text-[#DBD7D0]',
  },
  web: {
    Icon: Globe,
    className: 'bg-[#E7EBF1] text-[#4B6484] dark:bg-[#1F252E] dark:text-[#A2B8D2]',
  },
};

export default function SourceIcon({ source, size = 'md', className }) {
  const { Icon, className: tone } = MAP[source] ?? MAP.web;
  const dimensions = size === 'sm' ? 'h-5 w-5 rounded-[6px]' : 'h-8 w-8 rounded-[9px]';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  return (
    <span className={cn('grid shrink-0 place-items-center', dimensions, tone, className)}>
      <Icon className={iconSize} strokeWidth={1.9} />
    </span>
  );
}