import Link from 'next/link';
import { Loader2, RefreshCw, type LucideIcon } from 'lucide-react';
import type { EntityLoadStatus } from '../../hooks/useEntityLoader';

interface EntityLoadStateProps {
  status: Exclude<EntityLoadStatus, 'ready'>;
  /** Singular noun with article, e.g. "la empresa", "el usuario" */
  entityLabel: string;
  /** Feminine/masculine ending for "encontrada/o" */
  gender: 'f' | 'm';
  backHref: string;
  backLabel: string;
  icon: LucideIcon;
  onRetry: () => void;
}

// Loading, not-found and error screens shared by every edit page
export const EntityLoadState = ({
  status,
  entityLabel,
  gender,
  backHref,
  backLabel,
  icon: Icon,
  onRetry,
}: EntityLoadStateProps) => {
  if (status === 'loading') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={40} aria-label={`Cargando ${entityLabel}`} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-20 space-y-3">
        <h2 className="text-xl font-bold text-zinc-900">No pudimos cargar {entityLabel}</h2>
        <p className="text-sm text-zinc-500">Revisa tu conexión e inténtalo de nuevo.</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  const noun = entityLabel.replace(/^(la|el) /, '');
  const title = `${noun.charAt(0).toUpperCase()}${noun.slice(1)} no encontrad${gender === 'f' ? 'a' : 'o'}`;

  return (
    <div className="text-center py-20 space-y-3">
      <Icon className="mx-auto text-zinc-300" size={40} />
      <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
      <p className="text-sm text-zinc-500">
        Es posible que haya sido eliminad{gender === 'f' ? 'a' : 'o'}.
      </p>
      <Link href={backHref} className="inline-block text-sm font-semibold text-teal-600 hover:text-teal-700">
        {backLabel}
      </Link>
    </div>
  );
};
