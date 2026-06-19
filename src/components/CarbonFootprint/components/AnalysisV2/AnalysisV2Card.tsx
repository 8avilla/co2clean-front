'use client';

import {
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  ApiCarbonFootprintAnalysis,
  CarbonFootprintAnalysisStatus,
} from '../../types';

interface AnalysisV2CardProps {
  analysis: ApiCarbonFootprintAnalysis;
  companyName: string;
  isInitializing: boolean;
  isDeleting: boolean;
  onInitialize: (analysis: ApiCarbonFootprintAnalysis) => void;
  onDelete: (analysis: ApiCarbonFootprintAnalysis) => void;
}

const STATUS_CONFIG: Record<
  CarbonFootprintAnalysisStatus,
  { label: string; icon: React.ReactNode; classes: string }
> = {
  NotStarted: {
    label: 'Sin iniciar',
    icon: <Clock size={13} />,
    classes: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  },
  Processing: {
    label: 'En proceso',
    icon: <Loader2 size={13} className="animate-spin" />,
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  Successful: {
    label: 'Completado',
    icon: <CheckCircle2 size={13} />,
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Deleted: {
    label: 'Eliminado',
    icon: <TriangleAlert size={13} />,
    classes: 'bg-red-50 text-red-600 border-red-200',
  },
};

function formatDate(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const AnalysisV2Card = ({
  analysis,
  companyName,
  isInitializing,
  isDeleting,
  onInitialize,
  onDelete,
}: AnalysisV2CardProps) => {
  const router = useRouter();
  const status = STATUS_CONFIG[analysis.status];
  const isDeleted = analysis.status === 'Deleted';

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm flex flex-col gap-0 overflow-hidden transition-shadow hover:shadow-md ${
        isDeleted ? 'border-red-100 opacity-60' : 'border-zinc-100'
      }`}
    >
      {/* Top accent bar by status */}
      <div
        className={`h-1 w-full ${
          analysis.status === 'Successful'
            ? 'bg-emerald-400'
            : analysis.status === 'Processing'
            ? 'bg-blue-400'
            : analysis.status === 'Deleted'
            ? 'bg-red-300'
            : 'bg-zinc-200'
        }`}
      />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Year + standard */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-3xl font-black text-zinc-900 leading-none">{analysis.year}</p>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">{companyName}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
            {analysis.standard === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064'}
          </span>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1.5 w-max px-2.5 py-1 rounded-full text-xs font-bold border ${status.classes}`}
        >
          {status.icon}
          {status.label}
        </span>

        {/* Creation date */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Calendar size={13} />
          <span>Creado {formatDate(analysis.createdAt)}</span>
        </div>
      </div>

      {/* Actions footer */}
      {!isDeleted && (
        <div className="px-5 pb-5 flex items-center justify-between gap-2 border-t border-zinc-50 pt-4">
          {analysis.status === 'Successful' ? (
            <button
              onClick={() => router.push(`/huella-carbono/analisis-v2/${analysis.id}`)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <BarChart2 size={15} />
              Ver resultados
            </button>
          ) : analysis.status === 'Processing' ? (
            <span className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-blue-50 text-blue-600">
              <Loader2 size={15} className="animate-spin" />
              Procesando...
            </span>
          ) : (
            <button
              onClick={() => onInitialize(analysis)}
              disabled={isInitializing}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInitializing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Play size={15} />
                  Inicializar
                </>
              )}
            </button>
          )}

          <button
            onClick={() => onDelete(analysis)}
            disabled={isDeleting}
            title="Eliminar análisis"
            className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
