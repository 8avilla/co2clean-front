// Shared form density tokens. Keep every form on these values so spacing stays consistent.

export type FormAccent = 'teal' | 'violet' | 'emerald';

/** Page width caps: forms never stretch across the whole screen. */
export const FORM_WIDTH = {
  standard: 'max-w-4xl',
  wide: 'max-w-5xl',
  narrow: 'max-w-2xl',
} as const;

/** 3-column field grid; fields that need more room use `md:col-span-2` or `md:col-span-3`. */
export const FORM_FIELD_GRID = 'grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3';

/** The one label style for every form field. */
export const FORM_LABEL_CLASS = 'block text-xs font-bold text-zinc-600';

const FOCUS_CLASSES: Record<FormAccent, string> = {
  teal: 'focus:ring-teal-500/20 focus:border-teal-500',
  violet: 'focus:ring-violet-500/20 focus:border-violet-500',
  emerald: 'focus:ring-emerald-500/20 focus:border-emerald-500',
};

/** Text input / select: 36px high (px-3 py-2 text-sm). */
export const formInputClass = (accent: FormAccent = 'teal'): string =>
  `w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm outline-none focus:ring-2 transition-all ${FOCUS_CLASSES[accent]}`;
