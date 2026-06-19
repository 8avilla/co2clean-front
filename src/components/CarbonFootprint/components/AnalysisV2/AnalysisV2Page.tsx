'use client';

import { useState, useEffect, useCallback } from 'react';
import { Leaf, Plus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useAnalysisV2 } from './hooks/useAnalysisV2';
import { AnalysisV2Card } from './AnalysisV2Card';
import { AnalysisCreateWizard } from './AnalysisCreateWizard';
import {
  ApiCarbonFootprintAnalysis,
  CarbonFootprintAnalysisStandard,
  CarbonFootprintAnalysisStatus,
} from '../../types';

function getActiveCompanyFromSession(): { id: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { company?: { id: string; name: string } | null };
    return parsed.company ?? null;
  } catch {
    return null;
  }
}

export const AnalysisV2Page = () => {
  const [activeCompany] = useState(() => getActiveCompanyFromSession());
  const [showWizard, setShowWizard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CarbonFootprintAnalysisStatus | ''>('');
  const [initializingId, setInitializingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    analyses,
    loading,
    error,
    load,
    getRecordCount,
    createAndInitialize,
    initializeExisting,
    refreshOne,
    remove,
  } = useAnalysisV2();

  useEffect(() => {
    if (activeCompany) {
      load(activeCompany.id);
    }
  }, [activeCompany, load]);

  // Poll every 10 seconds for analyses currently Processing
  const processingKey = analyses
    .filter(a => a.status === 'Processing')
    .map(a => a.id)
    .join(',');

  useEffect(() => {
    if (!processingKey) return;
    const ids = processingKey.split(',');
    const interval = setInterval(() => {
      ids.forEach(id => refreshOne(id).catch(() => undefined));
    }, 10_000);
    return () => clearInterval(interval);
  }, [processingKey, refreshOne]);

  const handleCreateAndInitialize = useCallback(
    async (year: number, standard: CarbonFootprintAnalysisStandard) => {
      if (!activeCompany) return;
      await createAndInitialize(activeCompany.id, year, standard);
      toast.success(`Análisis ${year} creado e inicializado`);
    },
    [activeCompany, createAndInitialize]
  );

  const handleInitialize = useCallback(
    async (analysis: ApiCarbonFootprintAnalysis) => {
      const result = await Swal.fire({
        title: '¿Inicializar el análisis?',
        text: `Se procesarán las emisiones del año ${analysis.year}.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, inicializar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0d9488',
        cancelButtonColor: '#71717a',
        reverseButtons: true,
      });
      if (!result.isConfirmed) return;

      setInitializingId(analysis.id);
      try {
        await initializeExisting(analysis.id);
        toast.success(`Análisis ${analysis.year} inicializado`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al inicializar');
      } finally {
        setInitializingId(null);
      }
    },
    [initializeExisting]
  );

  const handleDelete = useCallback(
    async (analysis: ApiCarbonFootprintAnalysis) => {
      const standardLabel = analysis.standard === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064';
      const result = await Swal.fire({
        title: '¿Eliminar análisis?',
        text: `Año ${analysis.year} · ${standardLabel}. Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#71717a',
        reverseButtons: true,
      });
      if (!result.isConfirmed) return;

      setDeletingId(analysis.id);
      try {
        await remove(analysis.id);
        toast.success(`Análisis ${analysis.year} eliminado`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar');
      } finally {
        setDeletingId(null);
      }
    },
    [remove]
  );

  const filteredAnalyses = analyses.filter(a => {
    const matchSearch = !searchTerm || String(a.year).includes(searchTerm);
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (!activeCompany) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-400">
        <Leaf size={40} className="text-zinc-300" />
        <div className="text-center space-y-1">
          <p className="font-bold text-zinc-700">Sin empresa activa</p>
          <p className="text-sm">Selecciona una empresa para ver los análisis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Análisis de Huella de Carbono V2</h1>
          <p className="text-sm text-zinc-500">
            Genera y revisa análisis de emisiones con cálculo en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(activeCompany.id)}
            disabled={loading}
            title="Recargar"
            className="p-2 text-zinc-500 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus size={18} />
            Nuevo Análisis
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por año..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as CarbonFootprintAnalysisStatus | '')}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-zinc-700 sm:w-52"
        >
          <option value="">Todos los estados</option>
          <option value="NotStarted">Sin iniciar</option>
          <option value="Processing">En proceso</option>
          <option value="Successful">Completado</option>
          <option value="Deleted">Eliminado</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-zinc-100 h-52 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 text-sm">
          {error}
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 p-16 flex flex-col items-center gap-4 text-zinc-400">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <Leaf size={26} className="text-blue-400" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-zinc-700">
              {searchTerm || statusFilter ? 'Sin resultados' : 'No hay análisis generados'}
            </p>
            <p className="text-sm">
              {searchTerm || statusFilter
                ? 'Prueba ajustando los filtros'
                : 'Haz clic en "Nuevo Análisis" para comenzar'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnalyses.map(analysis => (
            <AnalysisV2Card
              key={analysis.id}
              analysis={analysis}
              companyName={activeCompany.name}
              isInitializing={initializingId === analysis.id}
              isDeleting={deletingId === analysis.id}
              onInitialize={handleInitialize}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Wizard modal */}
      {showWizard && (
        <AnalysisCreateWizard
          companyId={activeCompany.id}
          existingAnalyses={analyses}
          onConfirm={handleCreateAndInitialize}
          onClose={() => setShowWizard(false)}
          getRecordCount={getRecordCount}
        />
      )}
    </div>
  );
};
