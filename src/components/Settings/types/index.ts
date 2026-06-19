export interface EmissionGroup {
  id: string;
  label: string;
}

export const EMISSION_GROUPS: EmissionGroup[] = [
  { id: '6a1c546f0e939a6a2532717c', label: 'Alcance 1 — Emisiones Directas de GEI' },
  { id: '6a1c546f0e939a6a2532717d', label: 'Alcance 2 — Emisiones Indirectas por Energía Importada' },
  { id: '6a1c546f0e939a6a2532717e', label: 'Alcance 3 — Otras Emisiones Indirectas' },
  { id: '6a1c54700e939a6a2532717f', label: 'Categoría 1 — Emisiones y Remociones Directas de GEI' },
  { id: '6a1c54700e939a6a25327180', label: 'Categoría 2 — Emisiones Indirectas de GEI por Energía Importada' },
  { id: '6a1c54710e939a6a25327181', label: 'Categoría 3 — Emisiones Indirectas de GEI por Transporte' },
  { id: '6a1c54710e939a6a25327182', label: 'Categoría 4 — Emisiones Indirectas de GEI por Productos Usados por la Organización' },
  { id: '6a1c54710e939a6a25327183', label: 'Categoría 5 — Emisiones Indirectas de GEI Asociadas al Uso de los Productos de la Organización' },
  { id: '6a1c54720e939a6a25327184', label: 'Categoría 6 — Emisiones Indirectas de GEI de Otras Fuentes' },
];

// Kept for GasService and GasesList
export interface Gas {
  id: string;
  chemical_name: string;
  formula: string;
  gwp: number;
  calculation_type: 'biogenic' | 'non_biogenic' | 'both';
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

export type FactorMassUnit = 'kg' | 'g' | 'mg';

// Aligned with GasFactor (/api/emission-factors)
export interface EmissionFactor {
  id?: string;
  gas_id: string;
  gas_formula?: string;
  gwp: number;
  factor: number;
  factor_mass_unit?: FactorMassUnit;
  uncertainty?: number;
  emission_unit_id: string;
  emission_unit_symbol?: string;
  emission_source_id: string;
  emission_source_category_id: string;
}

export interface FactorChanges {
  toCreate: Omit<EmissionFactor, 'id'>[];
  toUpdate: (EmissionFactor & { id: string })[];
  toDelete: string[];
}
