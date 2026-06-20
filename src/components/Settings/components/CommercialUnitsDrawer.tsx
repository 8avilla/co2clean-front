'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Plus, Edit2, Trash2, Loader2, ArrowRight, Info, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ApiCommercialUnit } from '@/components/CarbonFootprint/types';
import { EmissionUnitService, UnitTypeService, ApiEmissionUnit, ApiUnitType } from '@/shared/services/emission-source.service';
import { EmissionSourceService } from '@/shared/services/emission-source.service';
import { EmissionSource } from '../types';

// ── Commercial unit form modal ────────────────────────────────────────────────

interface CommercialUnitFormModalProps {
  unit: ApiCommercialUnit | undefined;
  baseUnits: ApiEmissionUnit[];
  unitTypes: ApiUnitType[];
  onSave: (data: Omit<ApiCommercialUnit, 'id'> & { id?: string }) => Promise<void>;
  onClose: () => void;
}

type FormErrors = Partial<Record<'displaySymbol' | 'displayName' | 'conversionFactor' | 'baseUnitSymbol', string>>;

const CommercialUnitFormModal = ({ unit, baseUnits, unitTypes, onSave, onClose }: CommercialUnitFormModalProps) => {
  const isEditing = !!unit;

  const [displaySymbol, setDisplaySymbol] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [conversionFactor, setConversionFactor] = useState<number | ''>('');
  const [baseUnitSymbol, setBaseUnitSymbol] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    setErrors({});
    setIsPickerOpen(false);
    if (unit) {
      setDisplaySymbol(unit.displaySymbol);
      setDisplayName(unit.displayName);
      setConversionFactor(unit.conversionFactor);
      setBaseUnitSymbol(unit.baseUnitSymbol);
    } else {
      setDisplaySymbol('');
      setDisplayName('');
      setConversionFactor('');
      setBaseUnitSymbol('');
    }
  }, [unit]);

  // Group base units by unit type for the picker
  const groupedUnits = useMemo(() => {
    const typeMap = new Map(unitTypes.map(t => [t.id, t.name]));
    const groups = new Map<string, { label: string; units: ApiEmissionUnit[] }>();

    for (const u of baseUnits) {
      const key = u.unitTypeId ?? '__other__';
      const label = u.unitTypeId ? (typeMap.get(u.unitTypeId) ?? 'Otras') : 'Otras';
      if (!groups.has(key)) groups.set(key, { label, units: [] });
      groups.get(key)!.units.push(u);
    }

    // Sort groups alphabetically, keep "Otras" last
    return Array.from(groups.entries())
      .sort(([ka, a], [kb, b]) => {
        if (ka === '__other__') return 1;
        if (kb === '__other__') return -1;
        return a.label.localeCompare(b.label, 'es');
      })
      .map(([key, group]) => ({ key, ...group }));
  }, [baseUnits, unitTypes]);

  const selectedUnit = useMemo(
    () => baseUnits.find(u => u.symbol === baseUnitSymbol),
    [baseUnits, baseUnitSymbol]
  );

  const clearError = (field: keyof FormErrors) =>
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!displaySymbol.trim()) next.displaySymbol = 'El símbolo es requerido.';
    if (!displayName.trim()) next.displayName = 'El nombre es requerido.';
    if (conversionFactor === '' || conversionFactor <= 0) next.conversionFactor = 'El factor debe ser mayor a 0.';
    if (!baseUnitSymbol) next.baseUnitSymbol = 'La unidad base es requerida.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSave({
        ...(unit?.id ? { id: unit.id } : {}),
        displaySymbol: displaySymbol.trim(),
        displayName: displayName.trim(),
        conversionFactor: Number(conversionFactor),
        baseUnitSymbol,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectUnit = (symbol: string) => {
    setBaseUnitSymbol(symbol);
    setIsPickerOpen(false);
    clearError('baseUnitSymbol');
  };

  const conversionHint =
    displaySymbol && conversionFactor && baseUnitSymbol
      ? `1 ${displaySymbol} = ${conversionFactor} ${baseUnitSymbol} — el sistema convierte automáticamente antes de calcular las emisiones`
      : null;

  const fieldClass = (error?: string) =>
    `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${error ? 'border-red-400 bg-red-50' : 'border-zinc-200'}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h3 className="text-base font-bold text-zinc-900">
            {isEditing ? 'Editar unidad comercial' : 'Nueva unidad comercial'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">
              Símbolo comercial <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displaySymbol}
              onChange={e => { setDisplaySymbol(e.target.value); clearError('displaySymbol'); }}
              placeholder="Ej: resma"
              className={fieldClass(errors.displaySymbol)}
            />
            {errors.displaySymbol && <p className="text-xs text-red-500">{errors.displaySymbol}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">
              Nombre descriptivo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); clearError('displayName'); }}
              placeholder="Ej: Resma carta (500 hojas)"
              className={fieldClass(errors.displayName)}
            />
            {errors.displayName && <p className="text-xs text-red-500">{errors.displayName}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">
              Factor de conversión <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.000001"
              value={conversionFactor}
              onChange={e => { setConversionFactor(e.target.value === '' ? '' : Number(e.target.value)); clearError('conversionFactor'); }}
              placeholder="Ej: 2.5"
              className={fieldClass(errors.conversionFactor)}
            />
            {errors.conversionFactor && <p className="text-xs text-red-500">{errors.conversionFactor}</p>}
          </div>

          {/* Unit base picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">
              Unidad base <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPickerOpen(prev => !prev)}
                className={`w-full px-3 py-2 rounded-lg border text-sm text-left flex items-center justify-between gap-2 outline-none transition-all focus:ring-2 focus:ring-violet-500/20 ${
                  isPickerOpen
                    ? 'border-violet-500 ring-2 ring-violet-500/20'
                    : errors.baseUnitSymbol
                    ? 'border-red-400 bg-red-50'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {selectedUnit ? (
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-800">{selectedUnit.name}</span>
                    <span className="font-mono text-xs font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">
                      {selectedUnit.symbol}
                    </span>
                  </span>
                ) : (
                  <span className="text-zinc-400">Selecciona la unidad base</span>
                )}
                <ChevronDown
                  size={14}
                  className={`text-zinc-400 flex-shrink-0 transition-transform duration-150 ${isPickerOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isPickerOpen && (
                <>
                  {/* Transparent layer to catch outside clicks */}
                  <div className="fixed inset-0 z-[70]" onClick={() => setIsPickerOpen(false)} />
                  <div className="absolute top-full left-0 right-0 z-[80] mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="max-h-56 overflow-y-auto">
                      {groupedUnits.map(group => (
                        <div key={group.key}>
                          <div className="px-3 py-1.5 bg-zinc-50 border-b border-zinc-100 sticky top-0">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                              {group.label}
                            </span>
                          </div>
                          {group.units.map(u => {
                            const isSelected = u.symbol === baseUnitSymbol;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => handleSelectUnit(u.symbol)}
                                className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-3 transition-colors ${
                                  isSelected
                                    ? 'bg-violet-50 text-violet-700'
                                    : 'text-zinc-700 hover:bg-zinc-50'
                                }`}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  {isSelected && <Check size={12} className="text-violet-600 flex-shrink-0" />}
                                  {!isSelected && <span className="w-3 flex-shrink-0" />}
                                  <span className="truncate">{u.name}</span>
                                </span>
                                <span
                                  className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                    isSelected
                                      ? 'bg-violet-100 text-violet-700'
                                      : 'bg-zinc-100 text-zinc-500'
                                  }`}
                                >
                                  {u.symbol}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            {errors.baseUnitSymbol && <p className="text-xs text-red-500">{errors.baseUnitSymbol}</p>}
          </div>

          {conversionHint && (
            <div className="flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2.5">
              <Info size={13} className="text-violet-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-violet-700 leading-relaxed">{conversionHint}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear unidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── CommercialUnitsDrawer ─────────────────────────────────────────────────────

interface CommercialUnitsDrawerProps {
  source: EmissionSource;
  onClose: () => void;
}

export const CommercialUnitsDrawer = ({ source, onClose }: CommercialUnitsDrawerProps) => {
  const [units, setUnits] = useState<ApiCommercialUnit[]>([]);
  const [baseUnits, setBaseUnits] = useState<ApiEmissionUnit[]>([]);
  const [unitTypes, setUnitTypes] = useState<ApiUnitType[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ApiCommercialUnit | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allUnits, allUnitTypes] = await Promise.all([
        EmissionUnitService.getUnits({ limit: 1000 }),
        UnitTypeService.getUnitTypes(),
      ]);
      const commercialTypeIds = new Set(
        allUnitTypes.filter(t => t.code.toUpperCase() === 'COMERCIAL').map(t => t.id)
      );
      const nonCommercialTypes = allUnitTypes.filter(t => t.code.toUpperCase() !== 'COMERCIAL');
      setBaseUnits(allUnits.filter(u => !u.unitTypeId || !commercialTypeIds.has(u.unitTypeId)));
      setUnitTypes(nonCommercialTypes);
    } catch {
      toast.error('Error al cargar el catálogo de unidades');
    }

    // Fetch commercial units separately — treat any error as empty (404 = none configured yet)
    try {
      const fetchedUnits = await EmissionSourceService.getCommercialUnits(source.id);
      setUnits(fetchedUnits);
    } catch {
      setUnits([]);
    }

    setLoading(false);
  }, [source.id]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditingUnit(undefined); setModalOpen(true); };
  const openEdit = (u: ApiCommercialUnit) => { setEditingUnit(u); setModalOpen(true); };

  const handleSave = async (data: Omit<ApiCommercialUnit, 'id'> & { id?: string }) => {
    try {
      if (data.id) {
        const updated = await EmissionSourceService.updateCommercialUnit(source.id, data.id, {
          displaySymbol: data.displaySymbol,
          displayName: data.displayName,
          conversionFactor: data.conversionFactor,
          baseUnitSymbol: data.baseUnitSymbol,
        });
        setUnits(prev => prev.map(u => u.id === data.id ? updated : u));
        toast.success('Unidad comercial actualizada exitosamente');
      } else {
        const created = await EmissionSourceService.createCommercialUnit(source.id, {
          displaySymbol: data.displaySymbol,
          displayName: data.displayName,
          conversionFactor: data.conversionFactor,
          baseUnitSymbol: data.baseUnitSymbol,
        });
        setUnits(prev => [...prev, created]);
        toast.success('Unidad comercial creada exitosamente');
      }
      setModalOpen(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar la unidad comercial';
      toast.error(msg);
      throw error;
    }
  };

  const handleDelete = async (u: ApiCommercialUnit) => {
    if (!confirm(`¿Eliminar la unidad "${u.displayName}"?`)) return;
    try {
      await EmissionSourceService.deleteCommercialUnit(source.id, u.id);
      setUnits(prev => prev.filter(x => x.id !== u.id));
      toast.success('Unidad comercial eliminada exitosamente');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar la unidad comercial';
      toast.error(msg);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-100 flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
              Fuente: {source.name}
            </p>
            <h2 className="text-lg font-bold text-zinc-900">Unidades comerciales configuradas</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Definen cómo los usuarios ingresan cantidades. El sistema convierte automáticamente a la unidad base.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors flex-shrink-0 ml-4"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-zinc-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : units.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-3">
                <ArrowRight size={20} className="text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-500">Sin unidades comerciales</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Esta fuente usa las unidades estándar del catálogo. Agrega una unidad comercial para permitir que los usuarios registren en unidades como resmas, cajas o pallets.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Símbolo</th>
                  <th className="px-5 py-3 text-left">Nombre</th>
                  <th className="px-5 py-3 text-right">Factor</th>
                  <th className="px-5 py-3 text-right">U. base</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {units.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-50/70 transition-colors group">
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded text-xs">
                        {u.displaySymbol}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-700">{u.displayName}</td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums text-zinc-700">{u.conversionFactor}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-mono text-[11px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                        {u.baseUnitSymbol}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-zinc-400 hover:text-violet-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-zinc-100 px-6 py-4">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 w-full justify-center py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-all active:scale-95"
          >
            <Plus size={15} />
            Agregar unidad comercial
          </button>
        </div>
      </div>

      {modalOpen && (
        <CommercialUnitFormModal
          unit={editingUnit}
          baseUnits={baseUnits}
          unitTypes={unitTypes}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
