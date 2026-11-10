import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { SortDirection } from '../../lib/list-utils';

interface SortableHeaderProps<TKey extends string> {
  label: string;
  sortKey: TKey;
  activeKey: TKey;
  direction: SortDirection;
  onSort: (key: TKey) => void;
  /** Overrides the cell classes (padding, alignment) for denser tables */
  className?: string;
}

// Table header cell that toggles sorting; exposes the state through aria-sort
export const SortableHeader = <TKey extends string>({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className = 'px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider',
}: SortableHeaderProps<TKey>) => {
  const isActive = activeKey === sortKey;
  const Icon = !isActive ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown;
  const ariaSort = !isActive ? 'none' : direction === 'asc' ? 'ascending' : 'descending';

  return (
    <th aria-sort={ariaSort} className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors"
      >
        {label}
        <Icon size={12} className={isActive ? 'text-teal-600' : 'text-zinc-300'} />
      </button>
    </th>
  );
};
