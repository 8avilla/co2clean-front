import { EmissionSource } from '../types';

export const EMISSION_SOURCES_MOCK: EmissionSource[] = [
  {
    id: 'src_diesel_movil',
    code: 'combustible_diesel_movil',
    name: 'Diesel B10 - Fuentes Móviles',
    category: 'Combustión Móvil',
    measurement_type: 'Volumen',
    uncertainty: 5,
    factors: [
      { gas_id: 'gas_co2', factor: 10.149, unit: 'L',  uncertainty: 3,  gwp_applied: 1.0   },
      { gas_id: 'gas_ch4', factor: 0.037,  unit: 'L',  uncertainty: 12, gwp_applied: 27.0  },
      { gas_id: 'gas_n2o', factor: 0.037,  unit: 'L',  uncertainty: 15, gwp_applied: 273.0 },
    ],
  },
  {
    id: 'src_gasolina_movil',
    code: 'combustible_gasolina_movil',
    name: 'Gasolina - Fuentes Móviles',
    category: 'Combustión Móvil',
    measurement_type: 'Volumen',
    uncertainty: 5,
    factors: [
      { gas_id: 'gas_co2', factor: 8.887, unit: 'L',  uncertainty: 3,  gwp_applied: 1.0   },
      { gas_id: 'gas_ch4', factor: 0.086, unit: 'L',  uncertainty: 12, gwp_applied: 27.0  },
      { gas_id: 'gas_n2o', factor: 0.086, unit: 'L',  uncertainty: 15, gwp_applied: 273.0 },
    ],
  },
  {
    id: 'src_glp_estacionario',
    code: 'combustible_glp_estacionario',
    name: 'GLP - Fuentes Estacionarias',
    category: 'Combustión Estacionaria',
    measurement_type: 'Volumen',
    uncertainty: 7,
    factors: [
      { gas_id: 'gas_co2', factor: 5.68,   unit: 'L',  uncertainty: 3,  gwp_applied: 1.0   },
      { gas_id: 'gas_ch4', factor: 0.003,  unit: 'L',  uncertainty: 15, gwp_applied: 27.0  },
      { gas_id: 'gas_n2o', factor: 0.0006, unit: 'L',  uncertainty: 18, gwp_applied: 273.0 },
    ],
  },
  {
    id: 'src_gas_natural_estacionario',
    code: 'combustible_gas_natural_estacionario',
    name: 'Gas Natural - Fuentes Estacionarias',
    category: 'Combustión Estacionaria',
    measurement_type: 'Volumen',
    uncertainty: 7,
    factors: [
      { gas_id: 'gas_co2', factor: 1.9,    unit: 'm³', uncertainty: 3,  gwp_applied: 1.0   },
      { gas_id: 'gas_ch4', factor: 0.001,  unit: 'm³', uncertainty: 15, gwp_applied: 27.0  },
      { gas_id: 'gas_n2o', factor: 0.0001, unit: 'm³', uncertainty: 18, gwp_applied: 273.0 },
    ],
  },
  {
    id: 'src_electricidad_sin',
    code: 'electricidad_sin_colombia',
    name: 'Electricidad - SIN Colombia',
    category: 'Electricidad Adquirida',
    measurement_type: 'Energía',
    uncertainty: 15,
    factors: [
      { gas_id: 'gas_co2', factor: 0.126, unit: 'kWh', uncertainty: 10, gwp_applied: 1.0 },
    ],
  },
  {
    id: 'src_transporte_terrestre',
    code: 'transporte_terrestre_terceros',
    name: 'Transporte Terrestre - Terceros',
    category: 'Transporte y Distribución',
    measurement_type: 'Longitud',
    uncertainty: 20,
    factors: [
      { gas_id: 'gas_co2', factor: 0.089,  unit: 'km',  uncertainty: 10, gwp_applied: 1.0   },
      { gas_id: 'gas_ch4', factor: 0.0001, unit: 'km',  uncertainty: 20, gwp_applied: 27.0  },
      { gas_id: 'gas_n2o', factor: 0.0001, unit: 'km',  uncertainty: 20, gwp_applied: 273.0 },
    ],
  },
];
