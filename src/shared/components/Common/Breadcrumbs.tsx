import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  /** Omit for the current page or for a section that has no page of its own */
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Match the width of the content below (e.g. "max-w-4xl mx-auto") */
  className?: string;
}

// The last item is the current page: plain text with aria-current instead of a link
export const Breadcrumbs = ({ items, className = '' }: BreadcrumbsProps) => (
  <nav aria-label="Ruta de navegación" className={className}>
    <ol className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5 min-w-0">
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-teal-700 hover:underline underline-offset-2 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                className={`truncate ${isLast ? 'font-semibold text-zinc-800' : ''}`}
              >
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight size={14} aria-hidden="true" className="text-zinc-300 flex-shrink-0" />}
          </li>
        );
      })}
    </ol>
  </nav>
);
