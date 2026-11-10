import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationAccent = 'teal' | 'violet' | 'emerald';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  /** Plural noun shown next to the total, e.g. "usuarios" */
  itemsLabel: string;
  onPageChange: (page: number) => void;
  /** Total before filters; when different from `totalItems` it is shown as "de N totales" */
  totalUnfiltered?: number;
  accent?: PaginationAccent;
}

const ACTIVE_PAGE_CLASSES: Record<PaginationAccent, string> = {
  teal: 'bg-teal-600 text-white shadow-sm shadow-teal-500/20',
  violet: 'bg-violet-600 text-white shadow-sm shadow-violet-500/20',
  emerald: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20',
};

/** Page numbers to show: first, last and the neighbours of the current page, with gaps as "gap". */
export const getVisiblePages = (page: number, totalPages: number): Array<number | 'gap'> => {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    candidate => candidate === 1 || candidate === totalPages || Math.abs(candidate - page) <= 1,
  );
  return pages.reduce<Array<number | 'gap'>>((result, current, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && current - previous > 1) result.push('gap');
    result.push(current);
    return result;
  }, []);
};

const NAV_BUTTON_CLASS =
  'p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

export const Pagination = ({
  page,
  totalPages,
  totalItems,
  itemsLabel,
  onPageChange,
  totalUnfiltered,
  accent = 'teal',
}: PaginationProps) => (
  <nav
    aria-label="Paginación"
    className="p-4 border-t border-zinc-100 bg-zinc-50/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"
  >
    <span className="text-xs text-zinc-500">
      Página <span className="font-bold text-zinc-700">{page}</span> de{' '}
      <span className="font-bold text-zinc-700">{totalPages}</span>
      {' '}— {totalItems.toLocaleString('es-CO')} {itemsLabel}
      {totalUnfiltered !== undefined && totalUnfiltered !== totalItems &&
        ` de ${totalUnfiltered.toLocaleString('es-CO')} totales`}
    </span>
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Página anterior"
        className={NAV_BUTTON_CLASS}
      >
        <ChevronLeft size={16} />
      </button>
      {getVisiblePages(page, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-2 text-zinc-400">…</span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-label={`Página ${item}`}
            aria-current={item === page ? 'page' : undefined}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
              item === page
                ? ACTIVE_PAGE_CLASSES[accent]
                : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Página siguiente"
        className={NAV_BUTTON_CLASS}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </nav>
);
