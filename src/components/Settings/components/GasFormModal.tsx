'use client';

import { useState, useEffect, type SyntheticEvent, type ChangeEvent } from 'react';
import { X } from 'lucide-react';
import { Gas } from '../types';

interface GasFormModalProps {
  gas: Gas | undefined;
  onSave: (gas: Omit<Gas, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

type CalcType = 'biogenic' | 'non_biogenic' | 'both';

const SUBSCRIPT_CHARS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

const CALC_OPTIONS: { value: CalcType; label: string; description: string; color: string }[] = [
  { value: 'biogenic',     label: 'Biogénico',    description: 'Emisiones de fuentes biológicas', color: 'emerald' },
  { value: 'non_biogenic', label: 'No biogénico', description: 'Emisiones de fuentes fósiles',    color: 'violet'  },
  { value: 'both',         label: 'Ambos',        description: 'Biogénico y no biogénico',        color: 'teal'    },
];

const COLOR_CLASSES: Record<string, { active: string; dot: string }> = {
  emerald: { active: 'bg-emerald-50 border-emerald-400 text-emerald-800', dot: 'bg-emerald-500' },
  violet:  { active: 'bg-violet-50  border-violet-400  text-violet-800',  dot: 'bg-violet-500'  },
  teal:    { active: 'bg-teal-50    border-teal-400    text-teal-800',    dot: 'bg-teal-500'    },
};

type FormErrors = Partial<Record<'chemicalName' | 'formula' | 'gwp', string>>;

export const GasFormModal = ({ gas, onSave, onClose }: GasFormModalProps) => {
  const isEditing = !!gas;

  const [chemicalName, setChemicalName] = useState('');
  const [formula, setFormula] = useState('');
  const [gwp, setGwp] = useState<number | ''>('');
  const [calculationType, setCalculationType] = useState<CalcType>('non_biogenic');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setErrors({});
    if (gas) {
      setChemicalName(gas.chemical_name);
      setFormula(gas.formula);
      setGwp(gas.gwp);
      setCalculationType(gas.calculation_type ?? 'non_biogenic');
      setIsActive(gas.is_active ?? true);
    } else {
      setChemicalName('');
      setFormula('');
      setGwp('');
      setCalculationType('non_biogenic');
      setIsActive(true);
    }
  }, [gas]);

  const clearError = (field: keyof FormErrors) =>
    setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!chemicalName.trim()) {
      next.chemicalName = 'El nombre químico es requerido.';
    } else if (chemicalName.trim().length < 2) {
      next.chemicalName = 'El nombre debe tener al menos 2 caracteres.';
    }

    if (!formula.trim()) {
      next.formula = 'La fórmula química es requerida.';
    }

    if (gwp === '') {
      next.gwp = 'El GWP es requerido.';
    } else if (gwp < 0) {
      next.gwp = 'El GWP no puede ser negativo.';
    } else if (!Number.isInteger(gwp)) {
      next.gwp = 'El GWP debe ser un número entero.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const appendSubscript = (char: string) => setFormula(f => f + char);

  const handleGwpChange = (e: ChangeEvent<HTMLInputElement>) => {
    clearError('gwp');
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
    if (!validate()) return;
    onSave({
      id: gas?.id,
      chemical_name: chemicalName.trim(),
      formula: formula.trim(),
      gwp: typeof gwp === 'number' ? gwp : 0,
      calculation_type: calculationType,
      is_active: isActive,
      description: gas?.description,
    });
  };

  const inputClass = (field: keyof FormErrors) =>
    `w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm transition-all ${
      errors[field]
        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30'
        : 'border-zinc-200 focus:ring-violet-500/20 focus:border-violet-500'
    }`;

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
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">

          {/* Nombre químico */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Nombre químico
            </label>
            <input
              type="text"
              value={chemicalName}
              onChange={e => { setChemicalName(e.target.value); clearError('chemicalName'); }}
              placeholder="Ej: Dióxido de Carbono"
              className={inputClass('chemicalName')}
            />
            {errors.chemicalName && (
              <p className="text-xs text-red-500 font-medium">{errors.chemicalName}</p>
            )}
          </div>

          {/* Fórmula con subíndices y preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Fórmula
            </label>
            <input
              type="text"
              value={formula}
              onChange={e => { setFormula(e.target.value); clearError('formula'); }}
              placeholder="Ej: CO₂"
              className={`${inputClass('formula')} font-mono`}
            />
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-zinc-400 font-semibold mr-0.5">Subíndices:</span>
              {SUBSCRIPT_CHARS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { appendSubscript(c); clearError('formula'); }}
                  className="w-6 h-6 text-xs font-mono font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded border border-violet-100 flex items-center justify-center transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
            {errors.formula && (
              <p className="text-xs text-red-500 font-medium">{errors.formula}</p>
            )}
            {formula && !errors.formula && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-100">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex-shrink-0">Vista previa</span>
                <span className="font-mono font-bold text-violet-700 text-base">{formula}</span>
              </div>
            )}
          </div>

          {/* GWP */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">GWP</label>
            <input
              type="number"
              step="1"
              min="0"
              value={gwp}
              placeholder="Ej: 273"
              onChange={handleGwpChange}
              className={inputClass('gwp')}
            />
            {errors.gwp ? (
              <p className="text-xs text-red-500 font-medium">{errors.gwp}</p>
            ) : (
              <p className="text-[10px] text-zinc-400">Potencial de calentamiento global relativo al CO₂. Debe ser un número entero ≥ 0.</p>
            )}
          </div>

          {/* Tipo de cálculo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Tipo de cálculo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CALC_OPTIONS.map(opt => {
                const isSelected = calculationType === opt.value;
                const cc = COLOR_CLASSES[opt.color];
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCalculationType(opt.value)}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? `${cc.active} shadow-sm`
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? cc.dot : 'bg-zinc-300'}`} />
                      <span className="text-xs font-bold">{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 leading-tight">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estado activo */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60">
            <div>
              <p className="text-sm font-semibold text-zinc-800">Gas activo</p>
              <p className="text-xs text-zinc-400">Los gases inactivos no aparecen en formularios de cálculo.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${isActive ? 'bg-teal-500' : 'bg-zinc-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
            </button>
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
