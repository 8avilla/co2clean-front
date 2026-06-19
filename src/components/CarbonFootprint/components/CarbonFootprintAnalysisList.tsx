'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Leaf,
  BarChart2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  X,
  Plus,
  Trash2,
  Calendar,
  TriangleAlert,
  RefreshCw,
} from 'lucide-react';
import {
  ApiCarbonFootprintAnalysis,
  CarbonFootprintAnalysisStandard,
  CarbonFootprintAnalysisStatus,
} from '../types';
import { CarbonFootprintAnalysisService } from '../services/carbonFootprintAnalysis.service';
import { CarbonFootprintService } from '../services/carbonFootprint.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

const CURRENT_YEAR = new Date().getFullYear();
const AVAILABLE_YEARS = Array.from({ length: 10 }, (_, i) => String(CURRENT_YEAR - i));

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

export const CarbonFootprintAnalysisList = () => {
  const router = useRouter();
  const [activeCompany] = useState(() => getActiveCompanyFromSession());

  const [analyses, setAnalyses] = useState<ApiCarbonFootprintAnalysis[]>([]);
  const [emissionYears, setEmissionYears] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalYear, setModalYear] = useState<string>(String(CURRENT_YEAR));
  const [modalStandard, setModalStandard] = useState<CarbonFootprintAnalysisStandard>('GHG_Protocol');
  const [isCreating, setIsCreating] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterAnio, setFilterAnio] = useState('');
  const [filterEstado, setFilterEstado] = useState<CarbonFootprintAnalysisStatus | ''>('');

  const loadData = useCallback(async () => {
    if (!activeCompany) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [analysisList, records] = await Promise.all([
        CarbonFootprintAnalysisService.getAll({ companyId: activeCompany.id }),
        CarbonFootprintService.fetchAll({ companyId: activeCompany.id }),
      ]);
      setAnalyses(analysisList);
      setEmissionYears(new Set(records.map(r => String(r.year))));
    } catch {
      toast.error('Error al cargar los análisis');
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasAnalysisWithYearAndStandard = (
    anio: string,
    standard: CarbonFootprintAnalysisStandard,
  ) =>
    analyses.some(
      a =>
        String(a.year) === anio &&
        a.standard === standard &&
        a.status !== 'Deleted'
    );

  const handleGenerateAnalysis = async () => {
    if (!activeCompany) return;
    if (hasAnalysisWithYearAndStandard(modalYear, modalStandard)) {
      const standardText =
        modalStandard === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064';
      toast.error(
        `Ya existe un análisis para el año ${modalYear} con el estándar ${standardText}`
      );
      return;
    }
    setIsCreating(true);
    try {
      const created = await CarbonFootprintAnalysisService.create({
        companyId: activeCompany.id,
        year: parseInt(modalYear, 10),
        standard: modalStandard,
      });
      setAnalyses(prev => [created, ...prev]);
      setShowModal(false);
      toast.success(`Análisis para el año ${modalYear} creado exitosamente`);
    } catch {
      toast.error('Error al crear el análisis');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInitialize = async (analysis: ApiCarbonFootprintAnalysis) => {
    const hasRecords = emissionYears.has(String(analysis.year));
    if (!hasRecords) {
      toast.error(
        `No se puede iniciar el análisis: no existen registros de emisiones cargados para el año ${analysis.year}.`
      );
      return;
    }

    const result = await Swal.fire({
      title: '¿Inicializar el análisis?',
      text: `Se procesarán las emisiones cargadas para el año ${analysis.year} y se generará el informe de Huella de Carbono.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar análisis',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d9488', // teal-600 to match the app theme
      cancelButtonColor: '#71717a', // zinc-500
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setUpdatingId(analysis.id);
    try {
      const updated = await CarbonFootprintAnalysisService.initialize(analysis.id);
      setAnalyses(prev => prev.map(a => (a.id === analysis.id ? updated : a)));
      toast.success(`Análisis del año ${analysis.year} inicializado`);
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : 'Error al inicializar el análisis';
      toast.error(errMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (analysis: ApiCarbonFootprintAnalysis) => {
    const standardText = analysis.standard === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064';
    const result = await Swal.fire({
      title: '¿Eliminar análisis?',
      text: `¿Estás seguro de eliminar el análisis del año ${analysis.year} con el estándar ${standardText}? Esta acción no se puede deshacer y borrará el informe generado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626', // red-600
      cancelButtonColor: '#71717a', // zinc-500
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setDeletingId(analysis.id);
    try {
      await CarbonFootprintAnalysisService.delete(analysis.id);
      setAnalyses(prev => prev.map(a => a.id === analysis.id ? { ...a, status: 'Deleted' } : a));
      toast.success(`Análisis del año ${analysis.year} (${standardText}) eliminado exitosamente`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error al eliminar el análisis';
      toast.error(errMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const uniqueAnios = [...new Set(analyses.map(a => String(a.year)))].sort().reverse();
  const activeFiltersCount = [filterAnio, filterEstado].filter(Boolean).length;

  const clearFilters = () => {
    setFilterAnio('');
    setFilterEstado('');
    setSearchTerm('');
  };

  const filteredAnalyses = analyses.filter(a => {
    const matchSearch =
      !searchTerm || String(a.year).includes(searchTerm);
    return (
      matchSearch &&
      (!filterAnio || String(a.year) === filterAnio) &&
      (!filterEstado || a.status === filterEstado)
    );
  });

  const getStatusBadge = (estado: CarbonFootprintAnalysisStatus) => {
    if (estado === 'Successful') {
      return (
        <span className="flex items-center gap-1.5 w-max px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
          <CheckCircle2 size={14} /> Completado
        </span>
      );
    }
    if (estado === 'Processing') {
      return (
        <span className="flex items-center gap-1.5 w-max px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
          <Loader2 size={14} className="animate-spin" /> En Proceso
        </span>
      );
    }
    if (estado === 'Deleted') {
      return (
        <span className="flex items-center gap-1.5 w-max px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
          <TriangleAlert size={14} /> Eliminado
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 w-max px-3 py-1 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-full text-xs font-bold">
        <Clock size={14} /> Sin Iniciar
      </span>
    );
  };

  const modalConflict = hasAnalysisWithYearAndStandard(modalYear, modalStandard);
  const modalHasRecords = emissionYears.has(modalYear);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Análisis de Huella de Carbono</h1>
          <p className="text-sm text-zinc-500">
            Gestiona y revisa el estado de los análisis de emisiones cargadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="p-2 text-zinc-500 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors disabled:opacity-50"
            title="Recargar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setModalYear(String(CURRENT_YEAR)); setModalStandard('GHG_Protocol'); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus size={18} />
            Crear Análisis
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por año..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${showFilters || activeFiltersCount > 0
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                  }`}
              >
                <SlidersHorizontal size={16} />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center bg-white text-blue-700 rounded-full text-xs font-black">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 border border-red-100 transition-colors"
                  title="Limpiar filtros"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Año</label>
                <select
                  value={filterAnio}
                  onChange={(e) => setFilterAnio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Todos los años</option>
                  {uniqueAnios.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Estado</label>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value as CarbonFootprintAnalysisStatus | '')}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Todos los estados</option>
                  <option value="NotStarted">Sin Iniciar</option>
                  <option value="Processing">En Proceso</option>
                  <option value="Successful">Completado</option>
                  <option value="Deleted">Eliminado</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-100">
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Empresa</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Año</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Estándar</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Estado</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Creado</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                    Cargando análisis...
                  </td>
                </tr>
              ) : filteredAnalyses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <Leaf className="text-blue-500" size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-zinc-900">No hay análisis generados</h3>
                        <p className="text-zinc-500 text-sm">
                          Haz clic en &quot;Crear Análisis&quot; para crear uno nuevo.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAnalyses.map(analysis => (
                  <tr key={analysis.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-zinc-900">
                      {activeCompany?.name ?? '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs font-medium">
                        {analysis.year}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold">
                        {analysis.standard === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(analysis.status)}</td>
                    <td className="px-6 py-4 text-zinc-500 text-xs">
                      {analysis.createdAt
                        ? new Date(analysis.createdAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {analysis.status === 'Successful' ? (
                          <button
                            onClick={() => router.push(`/huella-carbono/analisis/resultados/${analysis.id}`)}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                          >
                            <BarChart2 size={14} />
                            Ver Resultados
                          </button>
                        ) : analysis.status === 'Processing' ? (
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50">
                            <Loader2 size={14} className="animate-spin" />
                            Procesando...
                          </span>
                        ) : analysis.status === 'Deleted' ? (
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50">
                            Eliminado
                          </span>
                        ) : (
                          <button
                            onClick={() => handleInitialize(analysis)}
                            disabled={updatingId !== null}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingId === analysis.id ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Iniciando...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={14} />
                                Inicializar
                              </>
                            )}
                          </button>
                        )}
                        {analysis.status !== 'Deleted' && (
                          <button
                            onClick={() => handleDelete(analysis)}
                            disabled={deletingId === analysis.id}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                            title="Eliminar análisis"
                          >
                            {deletingId === analysis.id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Analysis Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isCreating && setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Crear Análisis</h2>
                  <p className="text-xs text-zinc-500">Selecciona el año a analizar</p>
                </div>
              </div>
              <button
                onClick={() => !isCreating && setShowModal(false)}
                disabled={isCreating}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Year selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <Calendar size={15} className="text-zinc-400" />
                Año de reporte
              </label>
              <select
                value={modalYear}
                onChange={(e) => setModalYear(e.target.value)}
                disabled={isCreating}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-zinc-900 bg-white disabled:opacity-50"
              >
                {AVAILABLE_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Standard selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Estándar de reporte
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['GHG_Protocol', 'ISO_14064'] as const).map((std) => (
                  <button
                    key={std}
                    type="button"
                    onClick={() => setModalStandard(std)}
                    disabled={isCreating}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 ${modalStandard === std
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-blue-300'
                      }`}
                  >
                    {std === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064'}
                  </button>
                ))}
              </div>
            </div>

            {/* Status feedback */}
            {modalConflict ? (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                <TriangleAlert size={16} className="mt-0.5 shrink-0 text-red-500" />
                <p>
                  Ya existe un análisis para el año <span className="font-bold">{modalYear}</span> con el estándar{' '}
                  <span className="font-bold">
                    {modalStandard === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064'}
                  </span>. Para crear uno nuevo, elimine el existente primero.
                </p>
              </div>
            ) : !modalHasRecords ? (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <p>
                  No hay registros de emisiones para el año{' '}
                  <span className="font-bold">{modalYear}</span>. El análisis se creará sin datos cargados.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                <p>
                  Hay registros disponibles para el año{' '}
                  <span className="font-bold">{modalYear}</span>. Puedes crear el análisis.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowModal(false)}
                disabled={isCreating}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateAnalysis}
                disabled={modalConflict || isCreating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Análisis'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
