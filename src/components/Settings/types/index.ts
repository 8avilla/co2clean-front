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

export interface Gas {
  id: string;
  chemical_name: string;
  formula: string;
  gwp: number;
  biogenic_calculation: boolean;
  non_biogenic_calculation: boolean;
}

export interface GasFactor {
  gas_id: string;
  factor: number;
  unit: string;
  uncertainty: number;
  gwp_applied: number;
}

export const MEASUREMENT_TYPES = [
  'Longitud',
  'Masa',
  'Volumen',
  'Energía',
  'Área',
  'Potencia',
  'Tiempo',
  'Cantidad',
] as const;

export type MeasurementType = typeof MEASUREMENT_TYPES[number];

export interface EmissionSource {
  id: string;
  code?: string;
  name: string;
  category: string;
  measurement_type: string;
  uncertainty: number;
  factors: GasFactor[];
}

export interface EmissionSourceCategory {
  id: string;
  name: string;
  description: string;
  emission_group_id: string;
}
