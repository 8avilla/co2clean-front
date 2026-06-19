import { Gas } from '../types';

export const GASES_MOCK: Gas[] = [
  {
    id: 'gas_co2',
    chemical_name: 'Dióxido de Carbono',
    formula: 'CO₂',
    gwp: 1.0,
    calculation_type: 'both',
    is_active: true,
    description: 'Gas de referencia para el cálculo del GWP.',
  },
  {
    id: 'gas_ch4',
    chemical_name: 'Metano',
    formula: 'CH₄',
    gwp: 27.0,
    calculation_type: 'both',
    is_active: true,
  },
  {
    id: 'gas_n2o',
    chemical_name: 'Óxido Nitroso',
    formula: 'N₂O',
    gwp: 273.0,
    calculation_type: 'non_biogenic',
    is_active: true,
  },
  {
    id: 'gas_hfc134a',
    chemical_name: 'Hidrofluorocarbono 134a',
    formula: 'HFC-134a',
    gwp: 1526.0,
    calculation_type: 'non_biogenic',
    is_active: true,
  },
  {
    id: 'gas_sf6',
    chemical_name: 'Hexafluoruro de Azufre',
    formula: 'SF₆',
    gwp: 25200.0,
    calculation_type: 'non_biogenic',
    is_active: true,
  },
];
