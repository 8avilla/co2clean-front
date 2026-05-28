'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Leaf,
  BarChart2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Loader2,
  SlidersHorizontal,
  X,
  Plus,
  Trash2,
  Calendar,
  TriangleAlert,
} from 'lucide-react';
import { CarbonFootprintService } from '../services/carbonFootprint.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type AnalysisStatus = 'Pendiente' | 'En Progreso' | 'Completado';

interface StoredAnalysis {
  id: string;
  empresaId: string;
  empresaNombre: string;
  anio: string;
  estadoAnalisis: AnalysisStatus;
  createdAt: string;
}

const ANALYSES_KEY = 'cleanco2_analyses_v2';
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

function loadAnalyses(empresaId: string): StoredAnalysis[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(ANALYSES_KEY);
    const all: StoredAnalysis[] = stored ? JSON.parse(stored) : [];
    return all.filter(a => a.empresaId === empresaId);
  } catch {
    return [];
  }
}

function persistAnalysis(analysis: StoredAnalysis): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(ANALYSES_KEY);
    const all: StoredAnalysis[] = stored ? JSON.parse(stored) : [];
    const idx = all.findIndex(a => a.id === analysis.id && a.empresaId === analysis.empresaId);
    if (idx >= 0) {
      all[idx] = analysis;
    } else {
      all.push(analysis);
    }
    localStorage.setItem(ANALYSES_KEY, JSON.stringify(all));
  } catch { /* noop */ }
}

function removeAnalysis(id: string, empresaId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(ANALYSES_KEY);
    const all: StoredAnalysis[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem(
      ANALYSES_KEY,
      JSON.stringify(all.filter(a => !(a.id === id && a.empresaId === empresaId)))
    );
  } catch { /* noop */ }
}

export const CarbonFootprintAnalysisList = () => {
  const router = useRouter();
  const [activeCompany] = useState(() => getActiveCompanyFromSession());

  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [emissionYears, setEmissionYears] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalYear, setModalYear] = useState<string>(String(CURRENT_YEAR));

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterAnio, setFilterAnio] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const loadData = useCallback(async () => {
    if (!activeCompany) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const records = await CarbonFootprintService.getCarbonFootprints({
        empresaId: activeCompany.id,
      });
      setEmissionYears(new Set(records.map(r => String(r.anio))));
      setAnalyses(loadAnalyses(activeCompany.id));
    } catch {
      toast.error('Error al cargar los análisis');
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const yearHasAnalysis = (anio: string) => analyses.some(a => a.anio === anio);

  const handleGenerateAnalysis = () => {
    if (!activeCompany) return;
    if (yearHasAnalysis(modalYear)) {
      toast.error(`Ya existe un análisis para el año ${modalYear}`);
      return;
    }
    const newAnalysis: StoredAnalysis = {
      id: modalYear,
      empresaId: activeCompany.id,
      empresaNombre: activeCompany.name,
      anio: modalYear,
      estadoAnalisis: 'Pendiente',
      createdAt: new Date().toISOString(),
    };
    persistAnalysis(newAnalysis);
    setAnalyses(prev => [...prev, newAnalysis]);
    setShowModal(false);
    toast.success(`Análisis para el año ${modalYear} generado exitosamente`);
  };

  const handleStartAnalysis = async (analysis: StoredAnalysis) => {
    if (!confirm('¿Estás seguro de iniciar el análisis? Una vez ejecutado no se podrá detener ni cancelar.'))
      return;
    setAnalyzingId(analysis.id);
    await new Promise(r => setTimeout(r, 2500));
    try {
      const updated: StoredAnalysis = { ...analysis, estadoAnalisis: 'Completado' };
      persistAnalysis(updated);
      setAnalyses(prev => prev.map(a => (a.id === analysis.id ? updated : a)));
      toast.success('Análisis completado exitosamente');
    } catch {
      toast.error('Error al completar el análisis');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDelete = (analysis: StoredAnalysis) => {
    if (!activeCompany) return;
    if (!confirm(`¿Estás seguro de eliminar el análisis del año ${analysis.anio}? Esta acción no se puede deshacer.`))
      return;
    removeAnalysis(analysis.id, activeCompany.id);
    setAnalyses(prev => prev.filter(a => a.id !== analysis.id));
    toast.success(`Análisis del año ${analysis.anio} eliminado`);
  };

  const uniqueAnios = [...new Set(analyses.map(a => a.anio))].sort().reverse();
  const ESTADOS: AnalysisStatus[] = ['Pendiente', 'En Progreso', 'Completado'];
  const activeFiltersCount = [filterAnio, filterEstado].filter(Boolean).length;

  const clearFilters = () => {
    setFilterAnio('');
    setFilterEstado('');
    setSearchTerm('');
  };

  const filteredAnalyses = analyses.filter(a => {
    const matchSearch =
      !searchTerm ||
      a.empresaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.anio.includes(searchTerm);
    return (
      matchSearch &&
      (!filterAnio || a.anio === filterAnio) &&
      (!filterEstado || a.estadoAnalisis === filterEstado)
    );
  });

  const getStatusBadge = (status: AnalysisStatus) => {
    switch (status) {
      case 'Completado':
        return (
          <span className="flex items-center gap-1.5 w-max px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
            <CheckCircle2 size={14} /> Completado
          </span>
        );
      case 'En Progreso':
        return (
          <span className="flex items-center gap-1.5 w-max px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
            <Clock size={14} /> En Progreso
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 w-max px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
            <AlertCircle size={14} /> Pendiente
          </span>
        );
    }
  };

  const modalConflict = yearHasAnalysis(modalYear);
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
        <button
          onClick={() => { setModalYear(String(CURRENT_YEAR)); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
        >
          <Plus size={18} />
          Generar Análisis
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por empresa o año..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${
                  showFilters || activeFiltersCount > 0
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
                  className="p-2 rounded-xl text-sm text-red-500 hover:bg-red-50 border border-red-100 transition-colors"
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
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Todos los estados</option>
                  {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Estado</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Fecha de creación</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    Cargando análisis...
                  </td>
                </tr>
              ) : filteredAnalyses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <Leaf className="text-blue-500" size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-zinc-900">No hay análisis generados</h3>
                        <p className="text-zinc-500 text-sm">
                          Haz clic en "Generar Análisis" para crear uno nuevo.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAnalyses.map(analysis => (
                  <tr key={analysis.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-zinc-900">{analysis.empresaNombre}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs font-medium">
                        {analysis.anio}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(analysis.estadoAnalisis)}</td>
                    <td className="px-6 py-4 text-zinc-500 text-xs">
                      {new Date(analysis.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {analysis.estadoAnalisis === 'Completado' ? (
                          <button
                            onClick={() => router.push(`/huella-carbono/analisis/resultados/${analysis.anio}`)}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                          >
                            <BarChart2 size={14} />
                            Ver Resultados
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartAnalysis(analysis)}
                            disabled={analyzingId !== null}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {analyzingId === analysis.id ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Analizando...
                              </>
                            ) : (
                              <>
                                <Play size={14} fill="currentColor" />
                                Iniciar Análisis
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(analysis)}
                          disabled={analyzingId === analysis.id}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
                          title="Eliminar análisis"
                        >
                          <Trash2 size={15} />
                        </button>
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
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Generar Análisis</h2>
                  <p className="text-xs text-zinc-500">Selecciona el año a analizar</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
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
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-zinc-900 bg-white"
              >
                {AVAILABLE_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Status feedback */}
            {modalConflict ? (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                <TriangleAlert size={16} className="mt-0.5 shrink-0 text-red-500" />
                <p>
                  Ya existe un análisis para el año <span className="font-bold">{modalYear}</span>.
                  Para crear uno nuevo, elimine el existente primero.
                </p>
              </div>
            ) : !modalHasRecords ? (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <p>
                  No hay registros de emisiones cargados para el año{' '}
                  <span className="font-bold">{modalYear}</span>. El análisis se generará vacío.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                <p>
                  Hay registros disponibles para el año{' '}
                  <span className="font-bold">{modalYear}</span>. Puedes generar el análisis.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateAnalysis}
                disabled={modalConflict}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generar Análisis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
