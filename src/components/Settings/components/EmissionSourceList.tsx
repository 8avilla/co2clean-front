'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, SlidersHorizontal, Flame, Zap, Truck, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { EmissionSource, EMISSION_GROUPS } from '../types';
import { EMISSION_SOURCES_MOCK } from '../data/emission-sources.mock';
import { EMISSION_SOURCE_CATEGORIES_MOCK } from '../data/emission-source-categories.mock';
import { EmissionSourceFormModal } from './EmissionSourceFormModal';

const getSourceGroupId = (categoryName: string): string => {
  const category = EMISSION_SOURCE_CATEGORIES_MOCK.find(
    c => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  return category?.emission_group_id ?? '';
};

const getGroupConfig = (groupId: string) => {
  const label = EMISSION_GROUPS.find(g => g.id === groupId)?.label ?? '';
  const shortLabel = label.split(' — ')[0] || '—';
  let className = 'bg-violet-50 text-violet-700 border-violet-200';
  if (label.startsWith('Alcance 1')) className = 'bg-amber-50 text-amber-700 border-amber-200';
  else if (label.startsWith('Alcance 2')) className = 'bg-blue-50 text-blue-700 border-blue-200';
  else if (label.startsWith('Alcance 3')) className = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return { label: shortLabel, className };
};

const getSourceIcon = (category: string) => {
  if (category.includes('Eléctric') || category.includes('Electricidad')) return <Zap size={16} className="text-amber-500" />;
  if (category.includes('Estacionaria') || category.includes('gas') || category.includes('Gas')) return <Flame size={16} className="text-orange-500" />;
  if (category.includes('Móvil') || category.includes('Transporte')) return <Truck size={16} className="text-blue-500" />;
  return <FileText size={16} className="text-zinc-500" />;
};

export const EmissionSourceList = () => {
  const [sources, setSources] = useState<EmissionSource[]>(EMISSION_SOURCES_MOCK);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<EmissionSource | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  const filteredSources = sources.filter(s => {
    const matchSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchScope = !scopeFilter || getSourceGroupId(s.category) === scopeFilter;
    return matchSearch && matchScope;
  });

  const handleOpenCreate = () => {
    setEditingSource(undefined);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (source: EmissionSource) => {
    setEditingSource(source);
    setFormModalOpen(true);
  };

  const handleSaveSource = (data: Omit<EmissionSource, 'id'> & { id?: string }) => {
    if (data.id) {
      setSources(prev => prev.map(s => (s.id === data.id ? (data as EmissionSource) : s)));
      toast.success('Fuente de emisión actualizada exitosamente');
    } else {
      const newSource: EmissionSource = { ...data, id: `src_${Date.now()}` };
      setSources(prev => [...prev, newSource]);
      toast.success('Fuente de emisión creada exitosamente');
    }
    setFormModalOpen(false);
  };

  const handleDelete = (source: EmissionSource) => {
    if (!confirm(`¿Estás seguro de eliminar la fuente "${source.name}"?`)) return;
    setSources(prev => prev.filter(s => s.id !== source.id));
    toast.success('Fuente de emisión eliminada exitosamente');
  };

  const activeFilters = [scopeFilter].filter(Boolean).length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Fuentes de Emisión</h1>
            <p className="text-sm text-zinc-500">
              Gestiona las fuentes de emisión y sus factores de cálculo.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Nueva Fuente
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, código o categoría..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-all whitespace-nowrap ${
                showFilters || activeFilters > 0
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {activeFilters > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-white text-violet-700 rounded-full text-xs font-black">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="pt-3 border-t border-zinc-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Grupo de emisión</label>
                <select
                  value={scopeFilter}
                  onChange={e => setScopeFilter(e.target.value)}
                  className="w-full sm:w-72 px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white"
                >
                  <option value="">Todos los grupos</option>
                  {EMISSION_GROUPS.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-zinc-100">
            {filteredSources.length > 0 ? (
              filteredSources.map(source => {
                const scopeConf = getGroupConfig(getSourceGroupId(source.category));
                const factorsCount = source.factors.length;
                return (
                  <div key={source.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100 flex-shrink-0">
                        {getSourceIcon(source.category)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-900 text-sm">{source.name}</p>
                        <p className="text-xs font-mono text-zinc-400">{source.code}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${scopeConf.className}`}>
                            {scopeConf.label}
                          </span>
                          <span className="text-xs text-zinc-500">{source.category}</span>
                          {factorsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                              {factorsCount} {factorsCount === 1 ? 'factor' : 'factores'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEdit(source)}
                        className="p-2 text-zinc-400 hover:text-violet-600 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(source)}
                        className="p-2 text-zinc-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="px-6 py-12 text-center text-zinc-500 text-sm">No se encontraron fuentes de emisión.</p>
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Fuente</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Alcance</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipo de medida</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Incertidumbre</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Factores</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSources.length > 0 ? (
                  filteredSources.map(source => {
                    const scopeConf = getGroupConfig(getSourceGroupId(source.category));
                    const factorsCount = source.factors.length;
                    return (
                      <tr key={source.id} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
                              {getSourceIcon(source.category)}
                            </div>
                            <div>
                              <span className="font-bold text-zinc-900 block">{source.name}</span>
                              <span className="text-xs font-mono text-zinc-400">{source.code}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${scopeConf.className}`}>
                            {scopeConf.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{source.category}</td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
                            {source.measurement_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {source.uncertainty > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              ±{source.uncertainty}%
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            factorsCount > 0
                              ? 'bg-violet-50 text-violet-700 border-violet-200'
                              : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                          }`}>
                            {factorsCount} {factorsCount === 1 ? 'factor' : 'factores'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(source)}
                              className="p-2 text-zinc-400 hover:text-violet-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(source)}
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
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron fuentes de emisión.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {formModalOpen && (
        <EmissionSourceFormModal
          source={editingSource}
          onSave={handleSaveSource}
          onClose={() => setFormModalOpen(false)}
        />
      )}
    </>
  );
};
