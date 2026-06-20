'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, X, Ruler, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmissionUnitService, UnitTypeService, ApiEmissionUnit, ApiUnitType } from '@/shared/services/emission-source.service';
import { EmissionUnitFormModal } from './EmissionUnitFormModal';

export const EmissionUnitList = () => {
  const [units, setUnits] = useState<ApiEmissionUnit[]>([]);
  const [unitTypes, setUnitTypes] = useState<ApiUnitType[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [unitTypeFilter, setUnitTypeFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ApiEmissionUnit | undefined>(undefined);

  // Unit types visible in the filter (exclude internal COMERCIAL type)
  const filterableUnitTypes = useMemo(
    () => unitTypes.filter(t => t.code.toUpperCase() !== 'COMERCIAL'),
    [unitTypes]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedUnits, fetchedTypes] = await Promise.all([
        EmissionUnitService.getUnits({ limit: 1000 }),
        UnitTypeService.getUnitTypes(),
      ]);
      setUnitTypes(fetchedTypes);
      // Filter out units belonging to the internal COMERCIAL unit type
      const commercialTypeIds = new Set(
        fetchedTypes.filter(t => t.code.toUpperCase() === 'COMERCIAL').map(t => t.id)
      );
      setUnits(fetchedUnits.filter(u => !u.unitTypeId || !commercialTypeIds.has(u.unitTypeId)));
    } catch {
      toast.error('Error al cargar las unidades de medida');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return units.filter(u => {
      if (unitTypeFilter && u.unitTypeId !== unitTypeFilter) return false;
      if (q) {
        return (
          u.name.toLowerCase().includes(q) ||
          u.symbol.toLowerCase().includes(q) ||
          (u.description ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [units, search, unitTypeFilter]);

  const unitTypeMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of unitTypes) m.set(t.id, t.name);
    return m;
  }, [unitTypes]);

  const hasActiveFilters = !!search || !!unitTypeFilter;

  const clearFilters = () => { setSearch(''); setUnitTypeFilter(''); };

  const openCreate = () => { setEditingUnit(undefined); setModalOpen(true); };
  const openEdit = (u: ApiEmissionUnit) => { setEditingUnit(u); setModalOpen(true); };

  const handleSave = async (data: Omit<ApiEmissionUnit, 'id'> & { id?: string }) => {
    try {
      if (data.id) {
        const updated = await EmissionUnitService.update(data.id, {
          name: data.name,
          symbol: data.symbol,
          unitTypeId: data.unitTypeId,
          description: data.description,
        });
        setUnits(prev => prev.map(u => u.id === updated.id ? updated : u));
        toast.success('Unidad de medida actualizada exitosamente');
      } else {
        const created = await EmissionUnitService.create({
          name: data.name,
          symbol: data.symbol,
          unitTypeId: data.unitTypeId,
          description: data.description,
        });
        setUnits(prev => [...prev, created]);
        toast.success('Unidad de medida creada exitosamente');
      }
      setModalOpen(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar la unidad';
      toast.error(msg);
      throw error;
    }
  };

  const handleDelete = async (u: ApiEmissionUnit) => {
    if (!confirm(`¿Eliminar la unidad "${u.name} (${u.symbol})"?`)) return;
    try {
      await EmissionUnitService.delete(u.id);
      setUnits(prev => prev.filter(x => x.id !== u.id));
      toast.success('Unidad de medida eliminada exitosamente');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar la unidad';
      toast.error(msg);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Unidades de Medida</h1>
            <p className="text-sm text-zinc-500">
              Gestiona las unidades utilizadas en factores y registros de emisión.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Plus size={15} />
            Nueva unidad
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-56">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o símbolo..."
              className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={unitTypeFilter}
            onChange={e => setUnitTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white text-zinc-700 sm:w-48"
          >
            <option value="">Todos los tipos</option>
            {filterableUnitTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <span className="text-xs text-zinc-400 ml-auto hidden md:inline-block">
            {filtered.length !== units.length
              ? `${filtered.length} de ${units.length} unidades`
              : `${units.length} ${units.length === 1 ? 'unidad' : 'unidades'}`}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-zinc-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Cargando unidades...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
                <Ruler size={20} className="text-zinc-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-500">
                {hasActiveFilters ? 'Sin resultados' : 'Sin unidades registradas'}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {hasActiveFilters
                  ? 'Prueba con otros filtros o términos de búsqueda'
                  : 'Crea la primera unidad de medida'}
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Símbolo</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Descripción</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-zinc-50/70 transition-colors group">
                      <td className="px-4 py-3 font-semibold text-zinc-800">{u.name}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded text-xs">
                          {u.symbol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-sm">
                        {u.unitTypeId ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600">
                            {unitTypeMap.get(u.unitTypeId) ?? u.unitTypeId}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-sm max-w-xs truncate">
                        {u.description ?? <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 text-zinc-400 hover:text-violet-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
                            title="Editar unidad"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
                            title="Eliminar unidad"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <EmissionUnitFormModal
          unit={editingUnit}
          unitTypes={filterableUnitTypes}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
