'use client';

import { useState, useEffect, type SyntheticEvent, type ChangeEvent } from 'react';
import { X } from 'lucide-react';
import { Gas } from '../types';

interface GasFormModalProps {
  gas: Gas | undefined;
  onSave: (gas: Omit<Gas, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const SUBSCRIPT_CHARS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

const Checkmark = () => (
  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const GasFormModal = ({ gas, onSave, onClose }: GasFormModalProps) => {
  const isEditing = !!gas;

  const [chemicalName, setChemicalName] = useState('');
  const [formula, setFormula] = useState('');
  const [gwp, setGwp] = useState<number | ''>('');
  const [biogenicCalculation, setBiogenicCalculation] = useState(false);
  const [nonBiogenicCalculation, setNonBiogenicCalculation] = useState(true);

  useEffect(() => {
    if (gas) {
      setChemicalName(gas.chemical_name);
      setFormula(gas.formula);
      setGwp(gas.gwp);
      setBiogenicCalculation(gas.biogenic_calculation);
      setNonBiogenicCalculation(gas.non_biogenic_calculation);
    } else {
      setChemicalName('');
      setFormula('');
      setGwp('');
      setBiogenicCalculation(false);
      setNonBiogenicCalculation(true);
    }
  }, [gas]);

  const appendSubscript = (char: string) => setFormula(f => f + char);

  const handleGwpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setGwp('');
    } else {
      const parsed = parseFloat(val);
      setGwp(isNaN(parsed) ? '' : parsed);
    }
  };

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({
      id: gas?.id,
      chemical_name: chemicalName.trim(),
      formula: formula.trim(),
      gwp: typeof gwp === 'number' ? gwp : 0,
      biogenic_calculation: biogenicCalculation,
      non_biogenic_calculation: nonBiogenicCalculation,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-zinc-900">
              {isEditing ? 'Editar gas' : 'Nuevo gas'}
            </h2>
            {isEditing && gas?.formula && (
              <span className="font-mono text-sm font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-lg border border-violet-100">
                {gas.formula}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Nombre químico */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Nombre químico
            </label>
            <input
              required
              type="text"
              value={chemicalName}
              onChange={e => setChemicalName(e.target.value)}
              placeholder="Ej: Dióxido de Carbono"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all"
            />
          </div>

          {/* Fórmula con subíndices y preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Fórmula
            </label>
            <input
              required
              type="text"
              value={formula}
              onChange={e => setFormula(e.target.value)}
              placeholder="Ej: CO₂"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm font-mono transition-all"
            />
            {/* Subscript quick-insert buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-zinc-400 font-semibold mr-0.5">Subíndices:</span>
              {SUBSCRIPT_CHARS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => appendSubscript(c)}
                  className="w-6 h-6 text-xs font-mono font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded border border-violet-100 flex items-center justify-center transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
            {/* Live preview */}
            {formula && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-100">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex-shrink-0">Vista previa</span>
                <span className="font-mono font-bold text-violet-700 text-base">{formula}</span>
              </div>
            )}
          </div>

          {/* GWP */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              GWP
            </label>
            <input
              required
              type="number"
              step="any"
              min="0"
              value={gwp}
              placeholder="Ej: 273"
              onChange={handleGwpChange}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all"
            />
            <p className="text-[10px] text-zinc-400">
              Potencial de calentamiento global relativo al CO₂.
            </p>
          </div>

          {/* Tipo de cálculo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Tipo de cálculo
            </label>
            <div className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={biogenicCalculation}
                  onClick={() => setBiogenicCalculation(v => !v)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    biogenicCalculation
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-white border-zinc-300'
                  }`}
                >
                  {biogenicCalculation && <Checkmark />}
                </button>
                <div>
                  <span className="text-sm font-semibold text-zinc-800">Cálculo biogénico</span>
                  <p className="text-xs text-zinc-400">Emisiones provenientes de fuentes biológicas</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={nonBiogenicCalculation}
                  onClick={() => setNonBiogenicCalculation(v => !v)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    nonBiogenicCalculation
                      ? 'bg-violet-500 border-violet-500'
                      : 'bg-white border-zinc-300'
                  }`}
                >
                  {nonBiogenicCalculation && <Checkmark />}
                </button>
                <div>
                  <span className="text-sm font-semibold text-zinc-800">Cálculo no biogénico</span>
                  <p className="text-xs text-zinc-400">Emisiones provenientes de fuentes fósiles</p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
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
              {isEditing ? 'Guardar cambios' : 'Crear gas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
