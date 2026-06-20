'use client';

import { useState, useEffect, useRef, useMemo, type SyntheticEvent } from 'react';
import { X, Plus, Trash2, Info, SlidersHorizontal, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  EmissionSource,
  EmissionSourceCategory,
  EmissionFactor,
  FactorChanges,
  FactorMassUnit,
  Gas,
  EMISSION_GROUPS,
} from '../types';
import { EmissionSourceCategoryService } from '@/shared/services/emission-source-category.service';
import {
  EmissionFactorService,
  EmissionUnitService,
  UnitTypeService,
  ApiEmissionUnit,
  ApiUnitType,
} from '@/shared/services/emission-source.service';
import { GasService } from '@/shared/services/gas.service';

interface EmissionSourceFormModalProps {
  source: EmissionSource | undefined;
  defaultCategory?: string;
  onSave: (
    data: Omit<EmissionSource, 'id'> & { id?: string },
    factorChanges: FactorChanges
  ) => void;
  onClose: () => void;
}

interface LocalEmissionFactor {
  _key: string;
  id?: string;
  gas_id: string;
  gwp: number;
  factor: number | '';
  factor_mass_unit: FactorMassUnit;
  uncertainty: number | '';
  emission_unit_id: string;
  _deleted: boolean;
}

type TabKey = 'info' | 'factors';

type InfoErrors = Partial<Record<'name' | 'categoryId', string>>;
type FactorRowErrors = Partial<Record<'gas_id' | 'factor' | 'uncertainty' | 'emission_unit_id', string>>;

const NEW_CATEGORY_VALUE = '__new__';

export const EmissionSourceFormModal = ({
  source,
  defaultCategory,
  onSave,
  onClose,
}: EmissionSourceFormModalProps) => {
  const isEditing = !!source;
  const newCatNameRef = useRef<HTMLInputElement>(null);
  const keyCounterRef = useRef(0);

  const [activeTab, setActiveTab] = useState<TabKey>('info');

  // Info fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitTypeId, setUnitTypeId] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Validation state
  const [infoErrors, setInfoErrors] = useState<InfoErrors>({});
  const [factorErrors, setFactorErrors] = useState<Record<string, FactorRowErrors>>({});

  // Catalog data
  const [localCategories, setLocalCategories] = useState<EmissionSourceCategory[]>([]);
  const [unitTypes, setUnitTypes] = useState<ApiUnitType[]>([]);
  const [emissionUnits, setEmissionUnits] = useState<ApiEmissionUnit[]>([]);
  const [gases, setGases] = useState<Gas[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
  const [isLoadingFactors, setIsLoadingFactors] = useState(false);

  // Group emission units by type for the factor row unit selector
  const groupedEmissionUnits = useMemo(() => {
    const typeMap = new Map(unitTypes.map(t => [t.id, t.name]));
    const groups = new Map<string, { key: string; label: string; units: ApiEmissionUnit[] }>();
    for (const u of emissionUnits) {
      const key = u.unitTypeId ?? '__other__';
      const label = u.unitTypeId ? (typeMap.get(u.unitTypeId) ?? 'Otras') : 'Otras';
      if (!groups.has(key)) groups.set(key, { key, label, units: [] });
      groups.get(key)!.units.push(u);
    }
    return Array.from(groups.values()).sort((a, b) => {
      if (a.key === '__other__') return 1;
      if (b.key === '__other__') return -1;
      return a.label.localeCompare(b.label, 'es');
    });
  }, [unitTypes, emissionUnits]);

  // Express category creation
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatGroupId, setNewCatGroupId] = useState(EMISSION_GROUPS[0].id);

  // Factors local state
  const [factors, setFactors] = useState<LocalEmissionFactor[]>([]);

  const activeFactors = factors.filter(f => !f._deleted);
  const hasFactorErrors = Object.keys(factorErrors).length > 0;
  const hasInfoErrors = Object.keys(infoErrors).length > 0;

  // ── Load catalogs once on mount ──────────────────────────────────────────

  useEffect(() => {
    setIsLoadingCatalogs(true);
    Promise.all([
      EmissionSourceCategoryService.getCategories(),
      UnitTypeService.getUnitTypes(),
      EmissionUnitService.getUnits(),
      GasService.getGases(),
    ])
      .then(([cats, types, units, gasData]) => {
        setLocalCategories(cats);
        setUnitTypes(types);
        setEmissionUnits(units);
        setGases(gasData);
      })
      .catch(() => toast.error('Error al cargar los catálogos'))
      .finally(() => setIsLoadingCatalogs(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Set default category once catalogs are ready (new source only) ───────

  const hasSetDefaultCatRef = useRef(false);

  useEffect(() => {
    if (hasSetDefaultCatRef.current) return;
    if (source || defaultCategory) return;
    if (localCategories.length === 0) return;
    hasSetDefaultCatRef.current = true;
    setCategoryId(localCategories[0].id);
  }, [localCategories, source, defaultCategory]);

  // ── Reset form when source/defaultCategory changes ────────────────────────

  useEffect(() => {
    hasSetDefaultCatRef.current = false;
    keyCounterRef.current = 0;
    setFactors([]);
    setInfoErrors({});
    setFactorErrors({});
    setActiveTab('info');
    setShowNewCat(false);
    setNewCatName('');
    setNewCatGroupId(EMISSION_GROUPS[0].id);

    if (source) {
      setName(source.name);
      setCode(source.code);
      setCategoryId(source.category_id);
      setUnitTypeId(source.unit_type_id ?? '');
      setIsActive(source.is_active);
    } else {
      setName('');
      setCode('');
      setCategoryId(defaultCategory ?? '');
      setUnitTypeId('');
      setIsActive(true);
    }
  }, [source, defaultCategory]);

  // ── Load existing factors when editing ────────────────────────────────────

  useEffect(() => {
    if (!source?.id) return;
    setIsLoadingFactors(true);
    EmissionFactorService.getFactors({ emissionSourceId: source.id })
      .then(facts => {
        setFactors(
          facts.map(f => ({
            _key: f.id ?? `init_${Date.now()}`,
            id: f.id,
            gas_id: f.gas_id,
            gwp: f.gwp,
            factor: f.factor,
            factor_mass_unit: f.factor_mass_unit ?? 'kg',
            uncertainty: f.uncertainty ?? '',
            emission_unit_id: f.emission_unit_id,
            _deleted: false,
          }))
        );
      })
      .catch(() => toast.error('Error al cargar los factores de emisión'))
      .finally(() => setIsLoadingFactors(false));
  }, [source]);

  // ── Validation ────────────────────────────────────────────────────────────

  const validateInfo = (): InfoErrors => {
    const errs: InfoErrors = {};
    if (!name.trim()) {
      errs.name = 'El nombre es requerido.';
    } else if (name.trim().length < 2) {
      errs.name = 'El nombre debe tener al menos 2 caracteres.';
    }
    if (!categoryId) {
      errs.categoryId = 'Debes seleccionar una categoría de emisión.';
    }
    return errs;
  };

  const validateFactors = (): Record<string, FactorRowErrors> => {
    const errs: Record<string, FactorRowErrors> = {};
    for (const f of activeFactors) {
      const rowErrs: FactorRowErrors = {};

      if (!f.gas_id) {
        rowErrs.gas_id = 'Selecciona un gas.';
      }

      if (f.factor === '' || f.factor === null) {
        rowErrs.factor = 'El factor es requerido.';
      } else if (Number(f.factor) <= 0) {
        rowErrs.factor = 'El factor debe ser mayor a 0.';
      }

      if (f.uncertainty !== '') {
        const u = Number(f.uncertainty);
        if (u < 0) {
          rowErrs.uncertainty = 'No puede ser menor a 0%.';
        } else if (u > 100) {
          rowErrs.uncertainty = 'No puede superar el 100%.';
        }
      }

      if (!f.emission_unit_id) {
        rowErrs.emission_unit_id = 'Selecciona una unidad.';
      }

      if (Object.keys(rowErrs).length > 0) {
        errs[f._key] = rowErrs;
      }
    }
    return errs;
  };

  const clearInfoError = (field: keyof InfoErrors) =>
    setInfoErrors(prev => { const next = { ...prev }; delete next[field]; return next; });

  const clearFactorError = (key: string, field: keyof FactorRowErrors) =>
    setFactorErrors(prev => {
      if (!prev[key]) return prev;
      const row = { ...prev[key] };
      delete row[field];
      if (Object.keys(row).length === 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: row };
    });

  // ── Express category creation ─────────────────────────────────────────────

  const handleCategorySelectChange = (value: string) => {
    if (value === NEW_CATEGORY_VALUE) {
      setShowNewCat(true);
      setTimeout(() => newCatNameRef.current?.focus(), 50);
    } else {
      setCategoryId(value);
      clearInfoError('categoryId');
      setShowNewCat(false);
    }
  };

  const handleConfirmNewCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const slug = trimmed
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .toUpperCase()
      .slice(0, 20);
    try {
      const created = await EmissionSourceCategoryService.createCategory({
        name: trimmed,
        code: slug,
        description: '',
        emission_group_id: newCatGroupId,
      });
      setLocalCategories(prev => [...prev, created]);
      setCategoryId(created.id);
      clearInfoError('categoryId');
    } catch {
      const local: EmissionSourceCategory = {
        id: `cat_${Date.now()}`,
        code: slug,
        name: trimmed,
        description: '',
        emission_group_id: newCatGroupId,
        is_active: true,
      };
      setLocalCategories(prev => [...prev, local]);
      setCategoryId(local.id);
      clearInfoError('categoryId');
    }
    setShowNewCat(false);
    setNewCatName('');
    setNewCatGroupId(EMISSION_GROUPS[0].id);
  };

  const handleCancelNewCategory = () => {
    setShowNewCat(false);
    setNewCatName('');
    setNewCatGroupId(EMISSION_GROUPS[0].id);
  };

  // ── Factor helpers ────────────────────────────────────────────────────────

  const handleAddFactor = () => {
    keyCounterRef.current += 1;
    const firstGas = gases[0];
    setFactors(prev => [
      ...prev,
      {
        _key: `new_${keyCounterRef.current}`,
        gas_id: firstGas?.id ?? '',
        gwp: firstGas?.gwp ?? 0,
        factor: '',
        factor_mass_unit: 'kg' as FactorMassUnit,
        uncertainty: '',
        emission_unit_id: emissionUnits[0]?.id ?? '',
        _deleted: false,
      },
    ]);
  };

  const handleRemoveFactor = (key: string) => {
    setFactors(prev =>
      prev.reduce<LocalEmissionFactor[]>((acc, f) => {
        if (f._key !== key) return [...acc, f];
        if (f.id) return [...acc, { ...f, _deleted: true }];
        return acc;
      }, [])
    );
    setFactorErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateFactor = (key: string, patch: Partial<LocalEmissionFactor>) => {
    setFactors(prev => prev.map(f => (f._key === key ? { ...f, ...patch } : f)));
  };

  const handleGasChange = (key: string, gasId: string) => {
    const selected = gases.find(g => g.id === gasId);
    updateFactor(key, { gas_id: gasId, gwp: selected?.gwp ?? 0 });
    clearFactorError(key, 'gas_id');
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const infoErrs = validateInfo();
    const factorErrs = validateFactors();

    setInfoErrors(infoErrs);
    setFactorErrors(factorErrs);

    const hasInfoErr = Object.keys(infoErrs).length > 0;
    const hasFactorErr = Object.keys(factorErrs).length > 0;

    if (hasInfoErr) {
      setActiveTab('info');
      return;
    }
    if (hasFactorErr) {
      setActiveTab('factors');
      return;
    }

    const toCreate: Omit<EmissionFactor, 'id'>[] = factors
      .filter(f => !f.id && !f._deleted)
      .map(f => ({
        gas_id: f.gas_id,
        gwp: f.gwp,
        factor: typeof f.factor === 'number' ? f.factor : 0,
        factor_mass_unit: f.factor_mass_unit,
        uncertainty: typeof f.uncertainty === 'number' ? f.uncertainty : undefined,
        emission_unit_id: f.emission_unit_id,
        emission_source_id: '',
        emission_source_category_id: categoryId,
      }));

    const toUpdate: (EmissionFactor & { id: string })[] = factors
      .filter((f): f is LocalEmissionFactor & { id: string } => !!f.id && !f._deleted)
      .map(f => ({
        id: f.id,
        gas_id: f.gas_id,
        gwp: f.gwp,
        factor: typeof f.factor === 'number' ? f.factor : 0,
        factor_mass_unit: f.factor_mass_unit,
        uncertainty: typeof f.uncertainty === 'number' ? f.uncertainty : undefined,
        emission_unit_id: f.emission_unit_id,
        emission_source_id: source?.id ?? '',
        emission_source_category_id: categoryId,
      }));

    const toDelete: string[] = factors
      .filter((f): f is LocalEmissionFactor & { id: string } => !!f.id && f._deleted)
      .map(f => f.id);

    onSave(
      {
        id: source?.id,
        code: code.trim(),
        name: name.trim(),
        category_id: categoryId,
        unit_type_id: unitTypeId || undefined,
        measurement_type: unitTypes.find(u => u.id === unitTypeId)?.name ?? '',
        is_active: isActive,
      },
      { toCreate, toUpdate, toDelete }
    );
  };

  // ── Style helpers ─────────────────────────────────────────────────────────

  const infoInputClass = (field: keyof InfoErrors) =>
    `w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm transition-all ${
      infoErrors[field]
        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30'
        : 'border-zinc-200 focus:ring-violet-500/20 focus:border-violet-500'
    }`;

  const factorCellClass = (key: string, field: keyof FactorRowErrors) =>
    `w-full px-2 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 transition-all ${
      factorErrors[key]?.[field]
        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30'
        : 'border-zinc-200 focus:ring-violet-500/20 focus:border-violet-500'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              {isEditing ? 'Editar fuente de emisión' : 'Nueva fuente de emisión'}
            </h2>
            {isEditing && (
              <p className="text-sm text-zinc-400 mt-0.5">{source.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 px-6 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Info size={15} />
            Información
            {hasInfoErrors && (
              <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('factors')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'factors'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <SlidersHorizontal size={15} />
            Factores de Emisión
            {activeFactors.length > 0 && !hasFactorErrors && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-black bg-violet-100 text-violet-700">
                {activeFactors.length}
              </span>
            )}
            {hasFactorErrors && (
              <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
            )}
            {isLoadingFactors && (
              <Loader2 size={13} className="animate-spin text-zinc-400" />
            )}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto">

            {/* ── Tab: Información ─────────────────────────────────────── */}
            {activeTab === 'info' && (
              <div className="p-6 space-y-4">
                {isLoadingCatalogs ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-zinc-400">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">Cargando catálogos...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre</label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => { setName(e.target.value); clearInfoError('name'); }}
                          placeholder="Ej: Diesel B10 - Fuentes Móviles"
                          className={infoInputClass('name')}
                        />
                        {infoErrors.name && (
                          <p className="text-xs text-red-500 font-medium">{infoErrors.name}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Código</label>
                        <input
                          type="text"
                          value={code}
                          onChange={e => setCode(e.target.value)}
                          placeholder="Ej: ES-MOV-001"
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm font-mono transition-all"
                        />
                      </div>
                    </div>

                    {/* Unit type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipo de medida</label>
                      <select
                        value={unitTypeId}
                        onChange={e => setUnitTypeId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm bg-white transition-all"
                      >
                        <option value="">Sin tipo de medida</option>
                        {unitTypes.map(ut => (
                          <option key={ut.id} value={ut.id}>{ut.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category with express creation */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoría de Emisión</label>

                      {!showNewCat ? (
                        <select
                          value={categoryId}
                          onChange={e => handleCategorySelectChange(e.target.value)}
                          className={`${infoInputClass('categoryId')} bg-white`}
                        >
                          <option value="">Selecciona una categoría</option>
                          {localCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                          <option disabled>──────────────</option>
                          <option value={NEW_CATEGORY_VALUE}>＋ Nueva categoría de emisión...</option>
                        </select>
                      ) : (
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-violet-300 bg-violet-50">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                            <span className="text-sm text-violet-700 font-semibold">Creando nueva categoría...</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCancelNewCategory}
                            className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 transition-colors"
                          >
                            Cambiar
                          </button>
                        </div>
                      )}

                      {infoErrors.categoryId && !showNewCat && (
                        <p className="text-xs text-red-500 font-medium">{infoErrors.categoryId}</p>
                      )}

                      {showNewCat && (
                        <div className="p-4 rounded-xl border border-violet-200 bg-violet-50/40 space-y-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-500">Nombre de la categoría</label>
                            <input
                              ref={newCatNameRef}
                              type="text"
                              value={newCatName}
                              onChange={e => setNewCatName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleConfirmNewCategory();
                                }
                              }}
                              placeholder="Ej: Refrigeración"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm bg-white transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-500">Grupo de emisión</label>
                            <select
                              value={newCatGroupId}
                              onChange={e => setNewCatGroupId(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm bg-white transition-all"
                            >
                              {EMISSION_GROUPS.map(g => (
                                <option key={g.id} value={g.id}>{g.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelNewCategory}
                              className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleConfirmNewCategory}
                              disabled={!newCatName.trim()}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Check size={13} />
                              Crear y seleccionar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60">
                      <div>
                        <p className="text-sm font-semibold text-zinc-800">Fuente activa</p>
                        <p className="text-xs text-zinc-400">Las fuentes inactivas no aparecen en formularios de registro.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsActive(v => !v)}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${isActive ? 'bg-teal-500' : 'bg-zinc-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>

                    {/* Factor count shortcut */}
                    {activeFactors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('factors')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-100 bg-zinc-50/60 hover:bg-zinc-100/60 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal size={15} className="text-zinc-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-zinc-700">
                            {activeFactors.length} {activeFactors.length === 1 ? 'factor configurado' : 'factores configurados'}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-violet-600 flex-shrink-0">
                          {hasFactorErrors ? '⚠ Errores pendientes →' : 'Editar →'}
                        </span>
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Tab: Factores de Emisión ──────────────────────────────── */}
            {activeTab === 'factors' && (
              <div className="p-6 space-y-4">
                {isLoadingFactors ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-zinc-400">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">Cargando factores...</span>
                  </div>
                ) : (
                  <>
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="px-3 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Gas</th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider w-24">GWP</th>
                            <th className="px-3 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider w-28">
                              <span className="flex items-center justify-end gap-1">
                                Factor
                                <span className="text-red-400 font-black">*</span>
                              </span>
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider w-20">
                              U. masa
                            </th>
                            <th className="px-3 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider w-28">
                              <span className="flex items-center justify-end gap-1">
                                Incert. %
                                <span className="text-zinc-300 text-[10px] font-medium normal-case">(0–100)</span>
                              </span>
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider w-40">
                              Unidad
                              <span className="text-red-400 font-black ml-0.5">*</span>
                            </th>
                            <th className="w-8" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {activeFactors.map(f => {
                            const rowErr = factorErrors[f._key];
                            return (
                              <tr key={f._key} className={`transition-colors ${rowErr ? 'bg-red-50/30' : 'hover:bg-zinc-50/50'}`}>
                                <td className="px-3 py-2">
                                  <select
                                    value={f.gas_id}
                                    onChange={e => handleGasChange(f._key, e.target.value)}
                                    className={`${factorCellClass(f._key, 'gas_id')} bg-white`}
                                  >
                                    <option value="">Selecciona gas</option>
                                    {gases.map(g => (
                                      <option key={g.id} value={g.id}>
                                        {g.formula} — {g.chemical_name}
                                      </option>
                                    ))}
                                  </select>
                                  {rowErr?.gas_id && (
                                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{rowErr.gas_id}</p>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className="text-xs font-mono font-semibold text-zinc-500 tabular-nums">
                                    {f.gwp > 0 ? f.gwp.toLocaleString() : '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={f.factor}
                                    placeholder="0.000"
                                    onChange={e => {
                                      updateFactor(f._key, {
                                        factor: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                                      });
                                      clearFactorError(f._key, 'factor');
                                    }}
                                    className={`${factorCellClass(f._key, 'factor')} text-right`}
                                  />
                                  {rowErr?.factor && (
                                    <p className="text-[10px] text-red-500 font-medium mt-0.5 text-right">{rowErr.factor}</p>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <select
                                    value={f.factor_mass_unit}
                                    onChange={e => updateFactor(f._key, { factor_mass_unit: e.target.value as FactorMassUnit })}
                                    className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm bg-white outline-none transition-all font-mono"
                                    title="Unidad de masa del factor (por unidad de actividad)"
                                  >
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="mg">mg</option>
                                  </select>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    max="100"
                                    value={f.uncertainty}
                                    placeholder="—"
                                    onChange={e => {
                                      updateFactor(f._key, {
                                        uncertainty: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                                      });
                                      clearFactorError(f._key, 'uncertainty');
                                    }}
                                    className={`${factorCellClass(f._key, 'uncertainty')} text-right`}
                                  />
                                  {rowErr?.uncertainty && (
                                    <p className="text-[10px] text-red-500 font-medium mt-0.5 text-right">{rowErr.uncertainty}</p>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <select
                                    value={f.emission_unit_id}
                                    onChange={e => {
                                      updateFactor(f._key, { emission_unit_id: e.target.value });
                                      clearFactorError(f._key, 'emission_unit_id');
                                    }}
                                    className={`${factorCellClass(f._key, 'emission_unit_id')} bg-white font-mono`}
                                  >
                                    <option value="">Sin unidad</option>
                                    {groupedEmissionUnits.map(group => (
                                      <optgroup key={group.key} label={group.label}>
                                        {group.units.map(u => (
                                          <option key={u.id} value={u.id}>
                                            {u.symbol} — {u.name}
                                          </option>
                                        ))}
                                      </optgroup>
                                    ))}
                                  </select>
                                  {rowErr?.emission_unit_id && (
                                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{rowErr.emission_unit_id}</p>
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFactor(f._key)}
                                    className="p-1 text-zinc-300 hover:text-red-500 transition-colors rounded"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                          {activeFactors.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                                    <SlidersHorizontal size={18} className="text-zinc-400" />
                                  </div>
                                  <p className="text-sm font-semibold text-zinc-500">Sin factores de emisión</p>
                                  <p className="text-xs text-zinc-400 max-w-xs">
                                    Asocia un gas de efecto invernadero y su factor de conversión para calcular emisiones.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddFactor}
                      disabled={gases.length === 0}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50/50 text-violet-600 hover:text-violet-700 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={15} />
                      Agregar factor de emisión
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all shadow-sm active:scale-95"
            >
              {isEditing ? 'Guardar cambios' : 'Crear fuente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
