'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Info, SlidersHorizontal, Check } from 'lucide-react';
import { EmissionSource, EmissionSourceCategory, GasFactor, Gas, EMISSION_GROUPS, MEASUREMENT_TYPES } from '../types';
import { GASES_MOCK } from '../data/gases.mock';
import { EMISSION_SOURCE_CATEGORIES_MOCK } from '../data/emission-source-categories.mock';

interface EmissionSourceFormModalProps {
  source: EmissionSource | undefined;
  defaultCategory?: string;
  onSave: (source: Omit<EmissionSource, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const NEW_CATEGORY_VALUE = '__new__';

type TabKey = 'info' | 'factors';

const UNITS_BY_MEASUREMENT_TYPE: Record<string, string[]> = {
  Volumen:   ['L', 'm³', 'gal', 'ft³'],
  Masa:      ['kg', 't', 'g', 'lb'],
  Energía:   ['kWh', 'MJ', 'GJ', 'TJ'],
  Longitud:  ['km', 'm', 'mi'],
  Área:      ['m²', 'ha', 'ft²'],
  Potencia:  ['kW', 'MW', 'HP'],
  Tiempo:    ['h', 'min', 'd'],
  Cantidad:  ['unidad', 'docena', 'caja'],
};

export const EmissionSourceFormModal = ({ source, defaultCategory, onSave, onClose }: EmissionSourceFormModalProps) => {
  const isEditing = !!source;
  const gases: Gas[] = GASES_MOCK;
  const newCatNameRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('info');

  // Info fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState(EMISSION_SOURCE_CATEGORIES_MOCK[0].name);
  const [measurementType, setMeasurementType] = useState<string>(MEASUREMENT_TYPES[0]);
  const [uncertainty, setUncertainty] = useState(0);

  // Express category creation
  const [localCategories, setLocalCategories] = useState<EmissionSourceCategory[]>(EMISSION_SOURCE_CATEGORIES_MOCK);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatGroupId, setNewCatGroupId] = useState(EMISSION_GROUPS[0].id);

  // Factors fields
  const [factors, setFactors] = useState<GasFactor[]>([]);

  useEffect(() => {
    if (source) {
      setName(source.name);
      setCategory(source.category);
      setMeasurementType(source.measurement_type || MEASUREMENT_TYPES[0]);
      setUncertainty(source.uncertainty ?? 0);
      setFactors(source.factors.map(f => ({ ...f })));
    } else {
      setName('');
      setCategory(defaultCategory ?? localCategories[0]?.name ?? '');
      setMeasurementType(MEASUREMENT_TYPES[0]);
      setUncertainty(0);
      setFactors([]);
    }
    setActiveTab('info');
    setShowNewCat(false);
    setNewCatName('');
    setNewCatGroupId(EMISSION_GROUPS[0].id);
  }, [source]);

  // ── Express category creation ────────────────────────────────────────────

  const handleCategorySelectChange = (value: string) => {
    if (value === NEW_CATEGORY_VALUE) {
      setShowNewCat(true);
      setTimeout(() => newCatNameRef.current?.focus(), 50);
    } else {
      setCategory(value);
      setShowNewCat(false);
    }
  };

  const handleConfirmNewCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const newCat: EmissionSourceCategory = {
      id: `cat_${Date.now()}`,
      name: trimmed,
      description: '',
      emission_group_id: newCatGroupId,
    };
    setLocalCategories(prev => [...prev, newCat]);
    setCategory(newCat.name);
    setShowNewCat(false);
    setNewCatName('');
    setNewCatGroupId(EMISSION_GROUPS[0].id);
  };

  const handleCancelNewCategory = () => {
    setShowNewCat(false);
    setNewCatName('');
    setNewCatGroupId(EMISSION_GROUPS[0].id);
  };

  // ── Measurement type ─────────────────────────────────────────────────────

  const handleMeasurementTypeChange = (newType: string) => {
    setMeasurementType(newType);
    const defaultUnit = (UNITS_BY_MEASUREMENT_TYPE[newType] ?? [])[0] ?? '';
    setFactors(prev => prev.map(f => ({ ...f, unit: defaultUnit })));
  };

  // ── Factors helpers ──────────────────────────────────────────────────────

  const handleAddGasFactor = () => {
    const usedGasIds = factors.map(f => f.gas_id);
    const nextGas = gases.find(g => !usedGasIds.includes(g.id));
    if (!nextGas) return;
    const newFactor: GasFactor = {
      gas_id: nextGas.id,
      factor: 0,
      unit: (UNITS_BY_MEASUREMENT_TYPE[measurementType] ?? [])[0] ?? '',
      uncertainty: 0,
      gwp_applied: nextGas.gwp_versions.find(v => v.version === 'AR6')?.value ?? 1,
    };
    setFactors(prev => [...prev, newFactor]);
  };

  const handleRemoveGasFactor = (index: number) => {
    setFactors(prev => prev.filter((_, i) => i !== index));
  };

  const handleGasFactorChange = (index: number, gasId: string) => {
    setFactors(prev =>
      prev.map((f, i) => {
        if (i !== index) return f;
        const selectedGas = gases.find(g => g.id === gasId);
        const gwpApplied = selectedGas?.gwp_versions.find(v => v.version === 'AR6')?.value ?? f.gwp_applied;
        return { ...f, gas_id: gasId, gwp_applied: gwpApplied };
      })
    );
  };

  const handleFactorValueChange = (index: number, rawValue: string) => {
    setFactors(prev =>
      prev.map((f, i) => (i === index ? { ...f, factor: parseFloat(rawValue) || 0 } : f))
    );
  };

  const handleFactorUnitChange = (index: number, value: string) => {
    setFactors(prev =>
      prev.map((f, i) => (i === index ? { ...f, unit: value } : f))
    );
  };

  const handleFactorUncertaintyChange = (index: number, rawValue: string) => {
    setFactors(prev =>
      prev.map((f, i) => (i === index ? { ...f, uncertainty: parseFloat(rawValue) || 0 } : f))
    );
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({
      id: source?.id,
      name: name.trim(),
      code: '',
      category,
      measurement_type: measurementType,
      uncertainty,
      factors,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">

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
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'info'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
          >
            <Info size={15} />
            Información
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('factors')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'factors'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
          >
            <SlidersHorizontal size={15} />
            Factores de Emisión
            {factors.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-black bg-violet-100 text-violet-700">
                {factors.length}
              </span>
            )}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto">

            {/* ── Tab: Información ─────────────────────────────────────────── */}
            {activeTab === 'info' && (
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Diesel B10 - Fuentes Móviles"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipo de medida</label>
                    <select
                      value={measurementType}
                      onChange={e => handleMeasurementTypeChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm bg-white transition-all"
                    >
                      {MEASUREMENT_TYPES.map(mt => (
                        <option key={mt} value={mt}>{mt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Incertidumbre (%)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      value={uncertainty}
                      onChange={e => setUncertainty(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Category with express creation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoría de Emisión</label>
                  <select
                    value={showNewCat ? NEW_CATEGORY_VALUE : category}
                    onChange={e => handleCategorySelectChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm bg-white transition-all"
                  >
                    {localCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    <option disabled>──────────────</option>
                    <option value={NEW_CATEGORY_VALUE}>＋ Nueva categoría de emisión...</option>
                  </select>

                  {showNewCat && (
                    <div className="mt-1 p-4 rounded-xl border border-violet-200 bg-violet-50/40 space-y-3">
                      <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">Nueva categoría de emisión</p>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500">Nombre</label>
                        <input
                          ref={newCatNameRef}
                          type="text"
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmNewCategory(); } }}
                          placeholder="Ej: Refrigeración"
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all bg-white"
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
              </div>
            )}

            {/* ── Tab: Factores de Emisión ──────────────────────────────────── */}
            {activeTab === 'factors' && (
              <div className="p-6 space-y-4">
                {/* Gas factors table */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200">
                        <th className="px-3 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Gas</th>
                        <th className="px-3 py-3 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Factor</th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Unidad</th>
                        <th className="px-3 py-3 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">GWP</th>
                        <th className="px-3 py-3 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Incert. %</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {factors.map((gf, index) => (
                        <tr key={index} className="hover:bg-zinc-50/50">
                          <td className="px-3 py-2.5 min-w-[140px]">
                            <select
                              value={gf.gas_id}
                              onChange={e => handleGasFactorChange(index, e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 text-sm bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                            >
                              {gases.map(g => (
                                <option key={g.id} value={g.id}>
                                  {g.formula} — {g.chemical_name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5 w-24">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={gf.factor}
                              onChange={e => handleFactorValueChange(index, e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 text-sm text-right focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                            />
                          </td>
                          <td className="px-3 py-2.5 min-w-[90px]">
                            <select
                              value={gf.unit}
                              onChange={e => handleFactorUnitChange(index, e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 text-sm bg-white font-mono focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                            >
                              {(UNITS_BY_MEASUREMENT_TYPE[measurementType] ?? []).map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5 w-20">
                            <span className="block px-2 py-1.5 text-sm font-bold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg text-right">
                              {gf.gwp_applied}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 w-24">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              max="100"
                              value={gf.uncertainty}
                              onChange={e => handleFactorUncertaintyChange(index, e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 text-sm text-right focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                            />
                          </td>
                          <td className="px-2 py-2.5">
                            <button
                              type="button"
                              onClick={() => handleRemoveGasFactor(index)}
                              className="p-1 text-zinc-300 hover:text-red-500 transition-colors rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {factors.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">
                            Sin gases configurados. Agrega uno con el botón de abajo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={handleAddGasFactor}
                  disabled={factors.length >= gases.length}
                  className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={15} />
                  Agregar factor de emisión
                </button>
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
