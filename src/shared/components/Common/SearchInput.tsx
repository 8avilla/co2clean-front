'use client';

import { Search, X } from 'lucide-react';

type SearchInputAccent = 'violet' | 'teal' | 'emerald';

// Full class names so Tailwind can detect them at build time
const ACCENT_FOCUS_CLASSES: Record<SearchInputAccent, string> = {
  violet: 'focus:ring-violet-500/20 focus:border-violet-500',
  teal: 'focus:ring-teal-500/20 focus:border-teal-500',
  emerald: 'focus:ring-emerald-500/20 focus:border-emerald-500',
};

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accent?: SearchInputAccent;
  className?: string;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Buscar...',
  accent = 'violet',
  className = 'flex-1 min-w-56',
}: SearchInputProps) => (
  <div className={`relative ${className}`}>
    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
    <input
      type="text"
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      className={`w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 transition-all bg-white ${ACCENT_FOCUS_CLASSES[accent]}`}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Limpiar búsqueda"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
      >
        <X size={13} />
      </button>
    )}
  </div>
);
