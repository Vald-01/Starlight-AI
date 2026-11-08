import { cn } from '@/lib/utils';

/**
 * Brand logos live in a single 3 x 2 sprite sheet (public/logo-ia.png, 600 x 401),
 * one square cell per provider. Using percentage background positioning keeps the
 * crop exact at any display size, without hard-coding the sheet's pixel dimensions.
 */
const SPRITE_URL = '/logo-ia.png';

const CELLS = {
  gemini: [0, 0],
  groq: [1, 0],
  anthropic: [2, 0],
  openai: [0, 1],
  copilot: [1, 1],
  ollama: [2, 1],
};

export default function ProviderLogo({ provider, className }) {
  const [column, row] = CELLS[provider] ?? CELLS.groq;

  return (
    <span
      aria-hidden="true"
      className={cn('block shrink-0 rounded-lg bg-white bg-no-repeat ring-1 ring-black/5', className)}
      style={{
        backgroundImage: `url(${SPRITE_URL})`,
        backgroundSize: '300% 200%',
        backgroundPosition: `${column * 50}% ${row * 100}%`,
      }}
    />
  );
}
