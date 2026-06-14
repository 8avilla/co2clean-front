import { EmissionSourceCategory } from '../types';

export const EMISSION_SOURCE_CATEGORIES_MOCK: EmissionSourceCategory[] = [
  {
    id: 'cat_combustion_movil',
    name: 'Combustión Móvil',
    description: 'Emisiones generadas por vehículos y equipos de transporte que consumen combustibles fósiles.',
    emission_group_id: '6a1c546f0e939a6a2532717c',
  },
  {
    id: 'cat_combustion_estacionaria',
    name: 'Combustión Estacionaria',
    description: 'Emisiones provenientes de calderas, hornos, generadores y otros equipos fijos que consumen combustibles.',
    emission_group_id: '6a1c54700e939a6a2532717f',
  },
  {
    id: 'cat_procesos_industriales',
    name: 'Procesos Industriales',
    description: 'Emisiones directas derivadas de procesos físicos o químicos de la industria, distintas de la combustión.',
    emission_group_id: '6a1c54700e939a6a2532717f',
  },
  {
    id: 'cat_electricidad_adquirida',
    name: 'Electricidad Adquirida',
    description: 'Emisiones indirectas asociadas al consumo de energía eléctrica comprada a la red o a terceros.',
    emission_group_id: '6a1c546f0e939a6a2532717d',
  },
  {
    id: 'cat_transporte_distribucion',
    name: 'Transporte y Distribución',
    description: 'Emisiones indirectas generadas en el transporte de bienes y personas por parte de terceros en la cadena de valor.',
    emission_group_id: '6a1c54710e939a6a25327181',
  },
  {
    id: 'cat_residuos',
    name: 'Residuos',
    description: 'Emisiones asociadas al tratamiento y disposición final de residuos sólidos y aguas residuales.',
    emission_group_id: '6a1c54720e939a6a25327184',
  },
  {
    id: 'cat_otros',
    name: 'Otros',
    description: 'Categoría para fuentes de emisión que no encajan en las clasificaciones anteriores.',
    emission_group_id: '6a1c54720e939a6a25327184',
  },
];
