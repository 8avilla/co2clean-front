import { z } from 'zod';

export const CarbonFootprintSchema = z.object({
  id: z.string().optional(),
  createdAt: z.string().optional(),
  estadoAnalisis: z.enum(['Pendiente', 'En Progreso', 'Completado']).optional(),
  empresaId: z.string().min(1, 'Debe seleccionar una empresa'),
  sedeId: z.string().min(1, 'Debe seleccionar una sede'),
  anio: z.string().min(4, 'Año requerido'),
  modoCarga: z.string().optional(),
  categoria: z.string().min(1, 'Categoría requerida'),
  fuente: z.string().min(1, 'Fuente requerida'),
  subfuente: z.string().optional(),
  item: z.string().optional(),
  cantidadConsumida: z.string().optional(),
  unidad: z.string().optional(),
});

export type CarbonFootprintData = z.infer<typeof CarbonFootprintSchema>;

export interface CarbonFootprintListData extends CarbonFootprintData {
  empresaNombre: string;
  sedeNombre: string;
  categoriaNombre: string;
  fuenteNombre: string;
}

// Mock data structures based on HTML options
export const MODOS_CARGA = [
  'Mensual',
  'Anual'
];

export const CATEGORIAS = [
  { id: 'cat1', nombre: 'Categoría 1 — Emisiones directas de GEI' },
  { id: 'cat2', nombre: 'Categoría 2 — Emisiones indirectas de GEI por energía importada' },
  { id: 'cat4', nombre: 'Categoría 4 — Emisiones indirectas por productos utilizados por la organización' }
];

export const FUENTES = [
  { id: 'sin', nombre: 'Uso de energía del sistema interconectado nacional' },
  { id: 'movil', nombre: 'Combustión Móvil' },
  { id: 'estacionaria', nombre: 'Combustión Estacionaria' },
  { id: 'extintores', nombre: 'Recarga de Extintores' },
  { id: 'papel', nombre: 'Uso de papel' },
  { id: 'residuos', nombre: 'Eliminación de Residuos Sólidos' },
  { id: 'aguas', nombre: 'Tratamiento y eliminación de Aguas Residuales' }
];

export const SUBFUENTES_MOVIL = ['Gasolina', 'Diesel', 'Gas Natural'];

export const UNIDADES = ['kWh', 'Litros', 'm³', 'Galones', 'kg', 'Toneladas'];
