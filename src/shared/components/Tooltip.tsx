'use client';

import { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  maxWidth?: string;
}

export const Tooltip = ({ content, children, side = 'top', maxWidth = '220px' }: TooltipProps) => (
  <span className="relative inline-flex items-center group/tooltip">
    {children}
    <span
      style={{ maxWidth }}
      className={[
        'absolute z-50 px-2.5 py-1.5 text-[11px] leading-snug font-normal normal-case tracking-normal',
        'bg-zinc-900 text-zinc-100 rounded-lg shadow-xl pointer-events-none',
        'opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150',
        'whitespace-pre-wrap text-center',
        side === 'top'
          ? 'bottom-full mb-2.5 left-1/2 -translate-x-1/2'
          : 'top-full mt-2.5 left-1/2 -translate-x-1/2',
      ].join(' ')}
    >
      {content}
      <span
        className={[
          'absolute left-1/2 -translate-x-1/2 w-0 h-0 border-[4px] border-transparent',
          side === 'top' ? 'top-full border-t-zinc-900' : 'bottom-full border-b-zinc-900',
        ].join(' ')}
      />
    </span>
  </span>
);
