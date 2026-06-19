import { EmissionSource } from '../types';

export const EMISSION_SOURCES_MOCK: EmissionSource[] = [
  {
    id: 'src_diesel_movil',
    code: 'ES-MOV-001',
    name: 'Diesel B10 - Fuentes Móviles',
    category_id: 'cat_combustion_movil',
    measurement_type: 'Volumen',
    is_active: true,
  },
  {
    id: 'src_gasolina_movil',
    code: 'ES-MOV-002',
    name: 'Gasolina - Fuentes Móviles',
    category_id: 'cat_combustion_movil',
    measurement_type: 'Volumen',
    is_active: true,
  },
  {
    id: 'src_glp_estacionario',
    code: 'ES-EST-001',
    name: 'GLP - Fuentes Estacionarias',
    category_id: 'cat_combustion_estacionaria',
    measurement_type: 'Volumen',
    is_active: true,
  },
  {
    id: 'src_gas_natural_estacionario',
    code: 'ES-EST-002',
    name: 'Gas Natural - Fuentes Estacionarias',
    category_id: 'cat_combustion_estacionaria',
    measurement_type: 'Volumen',
    is_active: true,
  },
  {
    id: 'src_electricidad_sin',
    code: 'ES-ELE-001',
    name: 'Electricidad - SIN Colombia',
    category_id: 'cat_electricidad_adquirida',
    measurement_type: 'Energía',
    is_active: true,
  },
  {
    id: 'src_transporte_terrestre',
    code: 'ES-TRA-001',
    name: 'Transporte Terrestre - Terceros',
    category_id: 'cat_transporte_distribucion',
    measurement_type: 'Longitud',
    is_active: true,
  },
];
