'use client';

import { useState } from 'react';
import {
  Plus, Edit2, Trash2, FlaskConical,
  ArrowUpDown, ArrowUp, ArrowDown, Search, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Gas } from '../types';
import { GASES_MOCK } from '../data/gases.mock';
import { EMISSION_SOURCES_MOCK } from '../data/emission-sources.mock';
import { GasFormModal } from './GasFormModal';

type CalcFilter = 'all' | 'biogenic' | 'non_biogenic';
type GwpSort = 'asc' | 'desc' | null;

const CALC_FILTERS: { key: CalcFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'biogenic', label: 'Biogénico' },
  { key: 'non_biogenic', label: 'No biogénico' },
];

const getUsageCount = (gasId: string) =>
  EMISSION_SOURCES_MOCK.filter(s => s.factors.some(f => f.gas_id === gasId)).length;

export const GasesList = () => {
  const [gases, setGases] = useState<Gas[]>(GASES_MOCK);
  const [searchTerm, setSearchTerm] = useState('');
  const [calcFilter, setCalcFilter] = useState<CalcFilter>('all');
  const [sortByGwp, setSortByGwp] = useState<GwpSort>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGas, setEditingGas] = useState<Gas | undefined>(undefined);

  const filteredGases = gases.filter(g => {
    const matchSearch =
      !searchTerm ||
      g.chemical_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.formula.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCalc =
      calcFilter === 'all' ||
      (calcFilter === 'biogenic' && g.biogenic_calculation) ||
      (calcFilter === 'non_biogenic' && g.non_biogenic_calculation);
    return matchSearch && matchCalc;
  });

  const displayedGases = sortByGwp
    ? [...filteredGases].sort((a, b) => {
        const aV = a.gwp;
        const bV = b.gwp;
        return sortByGwp === 'asc' ? aV - bV : bV - aV;
      })
    : filteredGases;

  const hasActiveFilters = !!searchTerm || calcFilter !== 'all';

  const toggleGwpSort = () =>
    setSortByGwp(prev => (prev === null ? 'desc' : prev === 'desc' ? 'asc' : null));

  const clearFilters = () => { setSearchTerm(''); setCalcFilter('all'); };

  const gwpSortIcon = sortByGwp === 'asc'
    ? <ArrowUp size={12} className="text-violet-500" />
    : sortByGwp === 'desc'
    ? <ArrowDown size={12} className="text-violet-500" />
    : <ArrowUpDown size={12} className="text-zinc-300" />;

  const handleOpenCreate = () => { setEditingGas(undefined); setModalOpen(true); };
  const handleOpenEdit = (gas: Gas) => { setEditingGas(gas); setModalOpen(true); };

  const handleSave = (data: Omit<Gas, 'id'> & { id?: string }) => {
    if (data.id) {
      setGases(prev => prev.map(g => (g.id === data.id ? (data as Gas) : g)));
      toast.success('Gas actualizado exitosamente');
    } else {
      const newGas: Gas = { ...data, id: `gas_${Date.now()}` };
      setGases(prev => [...prev, newGas]);
      toast.success('Gas creado exitosamente');
    }
    setModalOpen(false);
  };

  const handleDelete = (gas: Gas) => {
    const usage = getUsageCount(gas.id);
    const warning = usage > 0
      ? `\n\nAtención: este gas está referenciado en ${usage} ${usage === 1 ? 'fuente' : 'fuentes'} de emisión.`
      : '';
    if (!confirm(`¿Estás seguro de eliminar "${gas.chemical_name}" (${gas.formula})?${warning}`)) return;
    setGases(prev => prev.filter(g => g.id !== gas.id));
    toast.success('Gas eliminado exitosamente');
  };

  const EmptyState = ({ colspan }: { colspan?: number }) => {
    const content = (
      <div className="px-6 py-16 text-center">
        <p className="text-sm font-semibold text-zinc-500">
          {hasActiveFilters ? 'Sin resultados' : 'Sin gases registrados'}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          {hasActiveFilters
            ? 'Prueba con otros filtros o términos de búsqueda'
            : 'Crea el primer gas de efecto invernadero'}
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    );
    return colspan
      ? <tr><td colSpan={colspan}>{content}</td></tr>
      : content;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Gases de Efecto Invernadero</h1>
            <p className="text-sm text-zinc-500">
              Gestiona los gases y sus valores de Potencial de Calentamiento Global (GWP).
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Nuevo Gas
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-zinc-100 flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por nombre o fórmula..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Calc type filter */}
            <div className="flex items-center gap-0.5 bg-zinc-100 rounded-lg p-0.5 flex-shrink-0">
              {CALC_FILTERS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setCalcFilter(opt.key)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    calcFilter === opt.key
                      ? 'bg-white text-zinc-800 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Result count */}
            <span className="text-xs text-zinc-400 flex-shrink-0 tabular-nums">
              {displayedGases.length} {displayedGases.length === 1 ? 'gas' : 'gases'}
              {hasActiveFilters && ` de ${gases.length}`}
            </span>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-zinc-100">
            {displayedGases.length > 0 ? (
              displayedGases.map(gas => {
                const usage = getUsageCount(gas.id);
                return (
                  <div key={gas.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold flex-shrink-0 border border-violet-100">
                        <FlaskConical size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-900 text-sm">{gas.chemical_name}</p>
                        <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {gas.formula}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-zinc-600">
                            GWP: <span className="font-bold text-zinc-900">{gas.gwp.toLocaleString()}</span>
                          </span>
                          {usage > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              {usage} {usage === 1 ? 'fuente' : 'fuentes'}
                            </span>
                          )}
                          {gas.biogenic_calculation && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Biogénico</span>
                          )}
                          {gas.non_biogenic_calculation && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">No biogénico</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEdit(gas)}
                        className="p-2 text-zinc-400 hover:text-violet-600 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(gas)}
                        className="p-2 text-zinc-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Gas</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Fórmula</th>
                  <th
                    className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:bg-zinc-100 select-none transition-colors"
                    onClick={toggleGwpSort}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>GWP</span>
                      {gwpSortIcon}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Cálculo</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {displayedGases.length > 0 ? (
                  displayedGases.map(gas => {
                    const usage = getUsageCount(gas.id);
                    return (
                      <tr key={gas.id} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 flex-shrink-0">
                              <FlaskConical size={16} />
                            </div>
                            <div>
                              <span className="font-bold text-zinc-900 block">{gas.chemical_name}</span>
                              {usage > 0 && (
                                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-200 inline-block mt-0.5">
                                  Usado en {usage} {usage === 1 ? 'fuente' : 'fuentes'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-md">
                            {gas.formula}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-zinc-800 tabular-nums">
                            {gas.gwp.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {gas.biogenic_calculation && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Biogénico
                              </span>
                            )}
                            {gas.non_biogenic_calculation && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                No biogénico
                              </span>
                            )}
                            {!gas.biogenic_calculation && !gas.non_biogenic_calculation && (
                              <span className="text-xs text-zinc-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEdit(gas)}
                              className="p-2 text-zinc-400 hover:text-violet-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(gas)}
                              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <EmptyState colspan={5} />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <GasFormModal
          gas={editingGas}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
