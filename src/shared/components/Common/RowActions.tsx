import Link from 'next/link';
import { Edit2, Trash2 } from 'lucide-react';

interface RowActionsProps {
  /** Name of the row, used to build accessible labels ("Editar Ana") */
  entityName: string;
  /** Link to an edit page. Use `onEdit` instead when editing opens a modal. */
  editHref?: string;
  /** Runs when the edit link is clicked, before navigating (e.g. to cache the record) */
  onEditClick?: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
  /** Tooltip / label verb for the edit link; defaults to "Editar" */
  editLabel?: string;
  canDelete?: boolean;
  onDelete?: () => void;
}

// Edit / delete icon buttons, always visible so they work with keyboard and touch
export const RowActions = ({
  entityName,
  editHref,
  onEditClick,
  onEdit,
  canEdit = true,
  editLabel = 'Editar',
  canDelete = true,
  onDelete,
}: RowActionsProps) => (
  <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
    {canEdit && editHref && (
      <Link
        href={editHref}
        onClick={onEditClick}
        className="p-2 text-zinc-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
        title={`${editLabel} ${entityName}`}
        aria-label={`${editLabel} ${entityName}`}
      >
        <Edit2 size={16} />
      </Link>
    )}
    {canEdit && !editHref && onEdit && (
      <button
        type="button"
        onClick={onEdit}
        className="p-2 text-zinc-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
        title={`${editLabel} ${entityName}`}
        aria-label={`${editLabel} ${entityName}`}
      >
        <Edit2 size={16} />
      </button>
    )}
    {canDelete && onDelete && (
      <button
        type="button"
        onClick={onDelete}
        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title={`Eliminar ${entityName}`}
        aria-label={`Eliminar ${entityName}`}
      >
        <Trash2 size={16} />
      </button>
    )}
  </div>
);
