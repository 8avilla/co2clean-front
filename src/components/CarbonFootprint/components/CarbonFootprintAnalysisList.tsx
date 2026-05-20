'use client';

import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { CarbonFootprintListData } from '../types';
import { CarbonFootprintService } from '../services/carbonFootprint.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export const CarbonFootprintAnalysisList = () => {
  const router = useRouter();
  const [footprints, setFootprints] = useState<CarbonFootprintListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterAnio, setFilterAnio] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const fetchFootprints = async () => {
    try {
      const data = await CarbonFootprintService.getCarbonFootprints();
      
      // Group by company + branch + year to avoid repeating years for the same location
      const groupedData: CarbonFootprintListData[] = [];
      const seen = new Set();

      data.forEach(fp => {
        const key = `${fp.empresaId}-${fp.sedeId}-${fp.anio}`;
        if (!seen.has(key)) {
          seen.add(key);
          groupedData.push(fp);
        }
      });

      setFootprints(groupedData);
    } catch (error) {
      toast.error('Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFootprints();
  }, []);

  const handleStartAnalysis = async (id: string) => {
    const confirmStart = confirm('¿Estás seguro de iniciar el análisis? Una vez ejecutado no se podrá detener ni cancelar.');
    if (!confirmStart) return;

    setAnalyzingId(id);
    
    // Simulate analysis process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      await CarbonFootprintService.updateCarbonFootprint(id, { estadoAnalisis: 'Completado' });
      toast.success('Análisis completado exitosamente');
      fetchFootprints();
    } catch (error) {
      toast.error('Error al actualizar el estado del análisis');
    } finally {
      setAnalyzingId(null);
    }
  };

  // Unique values for dropdowns (derived from loaded data)
  const uniqueAnios = [...new Set(footprints.map(f => f.anio))].sort().reverse();
  const uniqueEmpresas = [...new Set(footprints.map(f => f.empresaNombre))].sort();
  const ESTADOS = ['Pendiente', 'En Progreso', 'Completado'];

  const activeFiltersCount = [filterAnio, filterEmpresa, filterEstado].filter(Boolean).length;

  const clearFilters = () => {
    setFilterAnio('');
    setFilterEmpresa('');
    setFilterEstado('');
    setSearchTerm('');
  };

  const filteredFootprints = footprints.filter(f => {
    const matchSearch =
      !searchTerm ||
      f.empresaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.sedeNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.anio.includes(searchTerm);

    const matchAnio = !filterAnio || f.anio === filterAnio;
    const matchEmpresa = !filterEmpresa || f.empresaNombre === filterEmpresa;
    const matchEstado = !filterEstado || f.estadoAnalisis === filterEstado;

    return matchSearch && matchAnio && matchEmpresa && matchEstado;
  });

  const getStatusBadge = (status?: string) => {
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
      default: // Pendiente
        return (
          <span className="flex items-center gap-1.5 w-max px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
            <AlertCircle size={14} /> Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Análisis de Huella de Carbono</h1>
          <p className="text-sm text-zinc-500">Gestiona y revisa el estado de los análisis de emisiones cargadas.</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar por empresa, sede o año..."
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Año</label>
                <select
                  value={filterAnio}
                  onChange={e => setFilterAnio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Todos los años</option>
                  {uniqueAnios.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Empresa</label>
                <select
                  value={filterEmpresa}
                  onChange={e => setFilterEmpresa(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Todas las empresas</option>
                  {uniqueEmpresas.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Estado del análisis</label>
                <select
                  value={filterEstado}
                  onChange={e => setFilterEstado(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Todos los estados</option>
                  {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-100">
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Empresa y Sede</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Año</th>

                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Estado del Análisis</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    Cargando análisis...
                  </td>
                </tr>
              ) : filteredFootprints.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <Leaf className="text-blue-500" size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-zinc-900">No hay registros</h3>
                        <p className="text-zinc-500 text-sm">Aún no se han cargado emisiones para analizar.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFootprints.map((fp) => (
                  <tr key={fp.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900">{fp.empresaNombre}</span>
                        <span className="text-xs text-zinc-500">{fp.sedeNombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs font-medium">
                        {fp.anio}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(fp.estadoAnalisis)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {fp.estadoAnalisis === 'Completado' ? (
                        <button 
                          onClick={() => router.push(`/huella-carbono/analisis/resultados/${fp.id}`)}
                          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        >
                          <BarChart2 size={14} />
                          Ver Resultados
                        </button>
                      ) : (
                        <button 
                          onClick={() => fp.id && handleStartAnalysis(fp.id)}
                          disabled={analyzingId !== null}
                          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {analyzingId === fp.id ? (
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
