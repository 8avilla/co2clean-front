import type { FactorMassUnit } from '../../types';

export interface LocalEmissionFactor {
  _key: string;
  id?: string;
  gas_id: string;
  gwp: number;
  factor: number | '';
  factor_mass_unit: FactorMassUnit;
  coefficient: number | '';
  uncertainty: number | '';
  emission_unit_id: string;
  _deleted: boolean;
}

export type TabKey = 'info' | 'factors';

export type InfoErrors = Partial<Record<'name' | 'categoryId', string>>;

export type FactorRowErrors = Partial<
  Record<'gas_id' | 'factor' | 'coefficient' | 'uncertainty' | 'emission_unit_id', string>
>;

export interface EmissionUnitGroup<TUnit> {
  key: string;
  label: string;
  units: TUnit[];
}
