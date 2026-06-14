import { Gas } from '../types';

export const GASES_MOCK: Gas[] = [
  {
    id: 'gas_co2',
    chemical_name: 'Dióxido de Carbono',
    formula: 'CO₂',
    gwp_versions: [{ version: 'AR6', value: 1.0 }],
    biogenic_calculation: true,
    non_biogenic_calculation: true,
  },
  {
    id: 'gas_ch4',
    chemical_name: 'Metano',
    formula: 'CH₄',
    gwp_versions: [{ version: 'AR6', value: 27.0 }],
    biogenic_calculation: true,
    non_biogenic_calculation: true,
  },
  {
    id: 'gas_n2o',
    chemical_name: 'Óxido Nitroso',
    formula: 'N₂O',
    gwp_versions: [{ version: 'AR6', value: 273.0 }],
    biogenic_calculation: false,
    non_biogenic_calculation: true,
  },
  {
    id: 'gas_hfc134a',
    chemical_name: 'Hidrofluorocarbono 134a',
    formula: 'HFC-134a',
    gwp_versions: [{ version: 'AR6', value: 1526.0 }],
    biogenic_calculation: false,
    non_biogenic_calculation: true,
  },
  {
    id: 'gas_sf6',
    chemical_name: 'Hexafluoruro de Azufre',
    formula: 'SF₆',
    gwp_versions: [{ version: 'AR6', value: 25200.0 }],
    biogenic_calculation: false,
    non_biogenic_calculation: true,
  },
];
