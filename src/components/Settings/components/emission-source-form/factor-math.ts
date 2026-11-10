import type { FactorMassUnit } from '../../types';
import { formatNumber } from '@/shared/lib/format';

// Same conversion the analysis uses (see FACTOR_MASS_UNIT_TO_KG in CarbonFootprint types)
const MASS_UNIT_TO_KG: Record<FactorMassUnit, number> = {
  kg: 1,
  g: 0.001,
  mg: 0.000001,
};

interface FactorInputs {
  factor: number | '';
  massUnit: FactorMassUnit;
  coefficient: number | '';
  gwp: number;
}

/**
 * kg of CO₂e produced by ONE unit of activity with this factor.
 * Mirrors the analysis: factor (in kg) × coefficient × GWP. Undefined until the factor is filled in.
 */
export const calculateKgCo2ePerUnit = ({
  factor,
  massUnit,
  coefficient,
  gwp,
}: FactorInputs): number | undefined => {
  if (factor === '' || gwp <= 0) return undefined;
  const factorInKg = factor * (MASS_UNIT_TO_KG[massUnit] ?? 1);
  // An empty coefficient behaves as 1, exactly like the analysis does
  const effectiveCoefficient = coefficient === '' ? 1 : coefficient;
  return factorInKg * effectiveCoefficient * gwp;
};

/** Spanish number format with up to 6 significant digits (2,68 · 0,0000268 · 10.200). */
export const formatCo2e = (value: number): string => formatNumber(value, 6);

/** True when the GWP saved in the factor differs from the one the gas has now. */
export const isGwpOutdated = (factorGwp: number, currentGasGwp: number | undefined): boolean =>
  currentGasGwp !== undefined && factorGwp > 0 && factorGwp !== currentGasGwp;
