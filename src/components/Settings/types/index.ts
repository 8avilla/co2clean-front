export interface EmissionGroup {
  id: string;
  label: string;
}

// Kept for GasService and GasesList
export interface Gas {
  id: string;
  chemical_name: string;
  formula: string;
  gwp: number;
  calculation_type: "biogenic" | "non_biogenic" | "both";
  is_active: boolean;
  description?: string;
}

export interface EmissionSourceCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  emission_group_id: string;
  emission_group_name?: string;
  is_active: boolean;
  icon?: string;
}

// Aligned with ApiEmissionSubsource (/api/emission-sources)
export interface EmissionSource {
  id: string;
  code: string;
  name: string;
  description?: string;
  category_id: string;
  unit_type_id?: string;
  measurement_type: string;
  is_active: boolean;
}

export type FactorMassUnit = "kg" | "g" | "mg";

// Aligned with GasFactor (/api/emission-factors)
export interface EmissionFactor {
  id?: string;
  gas_id: string;
  gas_formula?: string;
  gwp: number;
  factor: number;
  factor_mass_unit?: FactorMassUnit;
  coefficient?: number;
  uncertainty?: number;
  emission_unit_id: string;
  emission_unit_symbol?: string;
  emission_source_id: string;
  emission_source_category_id: string;
}

export interface FactorChanges {
  toCreate: Omit<EmissionFactor, "id">[];
  toUpdate: (EmissionFactor & { id: string })[];
  toDelete: string[];
}
