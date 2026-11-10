export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md';

const VARIANT_CLASSES: Record<Exclude<ButtonVariant, 'primary'>, string> = {
  secondary: 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
  ghost: 'text-zinc-500 hover:bg-zinc-100',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
};

interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Single source of truth for button styling. Every primary button is teal, whatever the module. Also usable on `<Link>` elements. */
export const buttonClass = ({ variant = 'primary', size = 'md' }: ButtonClassOptions = {}): string => {
  const colors = variant === 'primary' ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm' : VARIANT_CLASSES[variant];
  return `inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${colors}`;
};
