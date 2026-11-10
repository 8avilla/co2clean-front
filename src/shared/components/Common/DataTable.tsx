import type { ElementType, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface DataTableProps {
  isLoading: boolean;
  loadingText?: string;
  isEmpty: boolean;
  emptyIcon?: ElementType;
  emptyTitle: string;
  emptyDescription?: string;
  /** Optional action under the empty message (e.g. "Limpiar filtros") */
  emptyAction?: ReactNode;
  /** The table (or list) rendered when there is data */
  children: ReactNode;
}

// Card container shared by every list: handles the loading, empty and data states
export const DataTable = ({
  isLoading,
  loadingText = 'Cargando...',
  isEmpty,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}: DataTableProps) => (
  <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
    {isLoading ? (
      <div className="flex items-center justify-center py-20 gap-2 text-zinc-400">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">{loadingText}</span>
      </div>
    ) : isEmpty ? (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        {EmptyIcon && (
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
            <EmptyIcon size={20} className="text-zinc-400" />
          </div>
        )}
        <p className="text-sm font-semibold text-zinc-500">{emptyTitle}</p>
        {emptyDescription && <p className="text-xs text-zinc-400 mt-1">{emptyDescription}</p>}
        {emptyAction}
      </div>
    ) : (
      children
    )}
  </div>
);
