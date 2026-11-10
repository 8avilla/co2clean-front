import { Fragment } from 'react';
import { AlertTriangle, Calculator, Loader2, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import type { FactorMassUnit, Gas } from '../../types';
import type { ApiEmissionUnit } from '@/shared/services/emission-source.service';
import type { EmissionUnitGroup, FactorRowErrors, LocalEmissionFactor } from './types';
import { calculateKgCo2ePerUnit, formatCo2e, isGwpOutdated } from './factor-math';
import { formatNumber } from '@/shared/lib/format';

interface EmissionFactorsTabProps {
  isLoading: boolean;
  activeFactors: LocalEmissionFactor[];
  factorErrors: Record<string, FactorRowErrors>;
  gases: Gas[];
  groupedEmissionUnits: EmissionUnitGroup<ApiEmissionUnit>[];
  onGasChange: (key: string, gasId: string) => void;
  onUpdateFactor: (key: string, patch: Partial<LocalEmissionFactor>) => void;
  onClearFactorError: (key: string, field: keyof FactorRowErrors) => void;
  onRemoveFactor: (key: string) => void;
  onAddFactor: () => void;
}

interface ColumnHeaderProps {
  label: string;
  hint?: string;
  isRequired?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

// Full column name plus a short hint, so the table can be read without decoding abbreviations
const ColumnHeader = ({ label, hint, isRequired = false, align = 'left', className = '' }: ColumnHeaderProps) => (
  <th
    className={`px-3 py-3 align-bottom text-xs font-bold text-zinc-600 uppercase tracking-wider ${
      align === 'right' ? 'text-right' : 'text-left'
    } ${className}`}
  >
    {label}
    {isRequired && <span className="text-red-400 font-black ml-0.5">*</span>}
    {hint && (
      <span className="block mt-0.5 text-[11px] font-medium normal-case tracking-normal text-zinc-500">{hint}</span>
    )}
  </th>
);

const COLUMN_GUIDE: Array<{ term: string; description: string }> = [
  { term: 'GWP', description: 'Potencial de calentamiento global: cuántas veces calienta el gas respecto al CO₂. Se toma del catálogo de gases.' },
  { term: 'Factor de emisión', description: 'Masa de gas que se emite por cada unidad de actividad (por ejemplo, kg de CO₂ por litro de diésel).' },
  { term: 'Unidad de masa', description: 'Unidad en la que está expresado el factor: kg, g o mg. El cálculo lo convierte a kg.' },
  { term: 'Coeficiente', description: 'Multiplicador adicional del factor. Déjalo en 1 si no aplica; vacío equivale a 1.' },
  { term: 'Incertidumbre (%)', description: 'Entre 0 y 100. Se combina entre los factores para estimar la incertidumbre total del análisis. Es opcional.' },
  { term: 'Unidad de actividad', description: 'Unidad con la que se mide la actividad registrada (litros, kWh, kg…). Los registros deben usar esa misma unidad.' },
];

export const EmissionFactorsTab = ({
  isLoading,
  activeFactors,
  factorErrors,
  gases,
  groupedEmissionUnits,
  onGasChange,
  onUpdateFactor,
  onClearFactorError,
  onRemoveFactor,
  onAddFactor,
}: EmissionFactorsTabProps) => {
  // 36px controls (py-2) so they are comfortable to hit and read
  const factorCellClass = (key: string, field: keyof FactorRowErrors) =>
    `w-full px-2.5 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-all ${
      factorErrors[key]?.[field]
        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30'
        : 'border-zinc-200 focus:ring-violet-500/20 focus:border-violet-500'
    }`;

  const getUnitSymbol = (unitId: string): string | undefined =>
    groupedEmissionUnits.flatMap(group => group.units).find(unit => unit.id === unitId)?.symbol;

  return (
    <div className="p-6 space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-zinc-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando factores...</span>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3 space-y-2">
            <p className="flex items-start gap-2 text-sm text-zinc-700">
              <Calculator size={16} className="text-violet-500 mt-0.5 flex-shrink-0" />
              <span>
                Las emisiones de cada registro se calculan como{' '}
                <strong className="font-semibold text-zinc-900">
                  cantidad × factor (en kg) × coeficiente × GWP ÷ 1000
                </strong>{' '}
                (toneladas de CO₂e). Un error en estos valores cambia los resultados de todos los análisis.
              </span>
            </p>
            <details className="text-sm text-zinc-600">
              <summary className="cursor-pointer font-semibold text-violet-700 hover:text-violet-800">
                ¿Qué significa cada columna?
              </summary>
              <dl className="mt-2 space-y-1.5">
                {COLUMN_GUIDE.map(item => (
                  <div key={item.term}>
                    <dt className="inline font-semibold text-zinc-800">{item.term}: </dt>
                    <dd className="inline">{item.description}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>

          <div className="border border-zinc-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <ColumnHeader label="Gas de efecto invernadero" />
                  <ColumnHeader label="GWP" hint="Equivalencia en CO₂" align="right" className="w-28" />
                  <ColumnHeader label="Factor de emisión" hint="Masa de gas por unidad" isRequired align="right" className="w-36" />
                  <ColumnHeader label="Unidad de masa" hint="Del factor" className="w-24" />
                  <ColumnHeader label="Coeficiente" hint="Multiplicador (1 = sin cambio)" align="right" className="w-36" />
                  <ColumnHeader label="Incertidumbre (%)" hint="Entre 0 y 100" align="right" className="w-32" />
                  <ColumnHeader label="Unidad de actividad" hint="La que se registra" isRequired className="w-44" />
                  <th className="w-12" aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {activeFactors.map(f => {
                  const rowErr = factorErrors[f._key];
                  const currentGas = gases.find(gas => gas.id === f.gas_id);
                  const gasLabel = currentGas ? currentGas.chemical_name : 'sin gas';
                  const kgCo2e = calculateKgCo2ePerUnit({
                    factor: f.factor,
                    massUnit: f.factor_mass_unit,
                    coefficient: f.coefficient,
                    gwp: f.gwp,
                  });
                  const unitSymbol = getUnitSymbol(f.emission_unit_id);
                  const hasOutdatedGwp = isGwpOutdated(f.gwp, currentGas?.gwp);

                  return (
                    <Fragment key={f._key}>
                      <tr className={`transition-colors ${rowErr ? 'bg-red-50/30' : 'hover:bg-zinc-50/50'}`}>
                        <td className="px-3 pt-3 pb-1">
                          <select
                            value={f.gas_id}
                            onChange={e => onGasChange(f._key, e.target.value)}
                            aria-label="Gas de efecto invernadero"
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
                            <p className="text-xs text-red-500 font-medium mt-1">{rowErr.gas_id}</p>
                          )}
                        </td>
                        <td className="px-3 pt-3 pb-1 text-right">
                          <span className="text-sm font-mono font-semibold text-zinc-600 tabular-nums">
                            {f.gwp > 0 ? formatNumber(f.gwp) : '—'}
                          </span>
                        </td>
                        <td className="px-3 pt-3 pb-1">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={f.factor}
                            placeholder="0.000"
                            aria-label="Factor de emisión"
                            onChange={e => {
                              onUpdateFactor(f._key, {
                                factor: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                              });
                              onClearFactorError(f._key, 'factor');
                            }}
                            className={`${factorCellClass(f._key, 'factor')} text-right`}
                          />
                          {rowErr?.factor && (
                            <p className="text-xs text-red-500 font-medium mt-1 text-right">{rowErr.factor}</p>
                          )}
                        </td>
                        <td className="px-3 pt-3 pb-1">
                          <select
                            value={f.factor_mass_unit}
                            onChange={e => onUpdateFactor(f._key, { factor_mass_unit: e.target.value as FactorMassUnit })}
                            aria-label="Unidad de masa del factor"
                            className="w-full px-2.5 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm bg-white outline-none transition-all font-mono"
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="mg">mg</option>
                          </select>
                        </td>
                        <td className="px-3 pt-3 pb-1">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={f.coefficient}
                            placeholder="1"
                            aria-label="Coeficiente"
                            onChange={e => {
                              onUpdateFactor(f._key, {
                                coefficient: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                              });
                              onClearFactorError(f._key, 'coefficient');
                            }}
                            className={`${factorCellClass(f._key, 'coefficient')} text-right`}
                          />
                          {rowErr?.coefficient && (
                            <p className="text-xs text-red-500 font-medium mt-1 text-right">{rowErr.coefficient}</p>
                          )}
                        </td>
                        <td className="px-3 pt-3 pb-1">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            value={f.uncertainty}
                            placeholder="—"
                            aria-label="Incertidumbre en porcentaje"
                            onChange={e => {
                              onUpdateFactor(f._key, {
                                uncertainty: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                              });
                              onClearFactorError(f._key, 'uncertainty');
                            }}
                            className={`${factorCellClass(f._key, 'uncertainty')} text-right`}
                          />
                          {rowErr?.uncertainty && (
                            <p className="text-xs text-red-500 font-medium mt-1 text-right">{rowErr.uncertainty}</p>
                          )}
                        </td>
                        <td className="px-3 pt-3 pb-1">
                          <select
                            value={f.emission_unit_id}
                            onChange={e => {
                              onUpdateFactor(f._key, { emission_unit_id: e.target.value });
                              onClearFactorError(f._key, 'emission_unit_id');
                            }}
                            aria-label="Unidad de actividad"
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
                            <p className="text-xs text-red-500 font-medium mt-1">{rowErr.emission_unit_id}</p>
                          )}
                        </td>
                        <td className="px-2 pt-3 pb-1 text-center">
                          <button
                            type="button"
                            onClick={() => onRemoveFactor(f._key)}
                            title={`Eliminar el factor de ${gasLabel}`}
                            aria-label={`Eliminar el factor de ${gasLabel}`}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>

                      {/* Read-only context for the row: what the numbers mean and whether they are stale */}
                      <tr className={`border-b border-zinc-100 ${rowErr ? 'bg-red-50/30' : ''}`}>
                        <td colSpan={8} className="px-3 pb-3 pt-1">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            {kgCo2e === undefined ? (
                              <span className="text-zinc-500">
                                Ingresa el factor y selecciona un gas para ver su equivalente en CO₂e.
                              </span>
                            ) : (
                              <span className="text-zinc-600">
                                Equivale a{' '}
                                <strong className="font-semibold text-zinc-900 tabular-nums">
                                  {formatCo2e(kgCo2e)} kg de CO₂e
                                </strong>{' '}
                                por cada {unitSymbol ?? 'unidad de actividad'}.
                              </span>
                            )}
                            {hasOutdatedGwp && currentGas && (
                              <span className="inline-flex flex-wrap items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-amber-800">
                                <AlertTriangle size={13} className="flex-shrink-0" />
                                GWP desactualizado: este factor usa {formatNumber(f.gwp)} y el gas ahora tiene{' '}
                                {formatNumber(currentGas.gwp)}.
                                <button
                                  type="button"
                                  onClick={() => onUpdateFactor(f._key, { gwp: currentGas.gwp })}
                                  className="font-semibold underline underline-offset-2 hover:text-amber-950"
                                >
                                  Actualizar a {formatNumber(currentGas.gwp)}
                                </button>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}

                {activeFactors.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                          <SlidersHorizontal size={18} className="text-zinc-400" />
                        </div>
                        <p className="text-sm font-semibold text-zinc-500">Sin factores de emisión</p>
                        <p className="text-xs text-zinc-500 max-w-xs">
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
            onClick={onAddFactor}
            disabled={gases.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50/50 text-violet-600 hover:text-violet-700 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} />
            Agregar factor de emisión
          </button>
        </>
      )}
    </div>
  );
};
