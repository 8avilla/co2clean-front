import type { ApiEmissionGroup } from '@/components/CarbonFootprint/types';

export const EMISSION_GROUP_IDS = {
  scope1: '6a1c546f0e939a6a2532717c',
  scope2: '6a1c546f0e939a6a2532717d',
  scope3: '6a1c546f0e939a6a2532717e',
} as const;

export const emissionGroupsFixture: ApiEmissionGroup[] = [
  { id: EMISSION_GROUP_IDS.scope1, code: 'ALCANCE_1', name: 'Alcance 1 — Emisiones Directas de GEI' },
  { id: EMISSION_GROUP_IDS.scope2, code: 'ALCANCE_2', name: 'Alcance 2 — Emisiones Indirectas por Energía Importada' },
  { id: EMISSION_GROUP_IDS.scope3, code: 'ALCANCE_3', name: 'Alcance 3 — Otras Emisiones Indirectas' },
];
