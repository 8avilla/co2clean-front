import { z } from 'zod';

// ── Catalog API shapes ──────────────────────────────────────────────────────

export interface ApiAlcance {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
}

export interface ApiFuenteEmision {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
}

export interface ApiSubfuenteEmision {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  fuenteEmisionId?: string;
}

export interface ApiUnidadEmision {
  id: string;
  nombre: string;
  simbolo: string;
  descripcion?: string;
}

export interface ApiEmissionFactor {
  id: string;
  nombre: string;
  descripcion?: string;
  anio: number;
  valor: number;
  alcanceId: string;
  fuenteEmisionId: string;
  subfuenteEmisionId?: string;
  unidadEmisionId: string;
  alcance?: ApiAlcance;
  fuenteEmision?: ApiFuenteEmision;
  subfuenteEmision?: ApiSubfuenteEmision;
  unidadEmision?: ApiUnidadEmision;
}

export interface CreateEmissionFactorPayload {
  nombre: string;
  descripcion?: string;
  anio: number;
  alcanceId: string;
  fuenteEmisionId: string;
  subfuenteEmisionId?: string;
  unidadEmisionId: string;
  valor: number;
}

export type UpdateEmissionFactorPayload = Partial<CreateEmissionFactorPayload>;

// ── Carbon footprint API shapes ─────────────────────────────────────────────

export interface ApiCarbonFootprint {
  id: string;
  anio: number;
  item?: string;
  cantidad?: number;
  modoCarga: 'Mensual' | 'Anual';
  sedeId: string;
  empresaId: string;
  alcanceId?: string;
  fuenteEmisionId: string;
  subfuenteEmisionId?: string;
  unidadEmisionId?: string;
  createdAt: string;
  alcance?: ApiAlcance;
  fuenteEmision?: ApiFuenteEmision;
  subfuenteEmision?: ApiSubfuenteEmision;
  unidadEmision?: ApiUnidadEmision;
}

// ── Service interfaces ──────────────────────────────────────────────────────

export interface CarbonFootprintFilters {
  empresaId: string;
  anio?: number;
  sedeId?: string;
  alcanceId?: string;
  fuenteEmisionId?: string;
  subfuenteEmisionId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
}

export interface UploadCsvParams {
  anio: string;
  nit: string;
  sedeId: string;
  alcanceId?: string;
  fuenteEmisionId: string;
  subfuenteEmisionId?: string;
  unidadEmisionId?: string;
  modoCarga?: 'Mensual' | 'Anual';
}

export interface UpdateCarbonFootprintPayload {
  anio?: number;
  item?: string;
  cantidad?: number;
  alcanceId?: string;
  fuenteEmisionId?: string;
  subfuenteEmisionId?: string;
  unidadEmisionId?: string;
  modoCarga?: 'Mensual' | 'Anual';
}

// ── Zod schema for upload form ──────────────────────────────────────────────

export const CarbonFootprintSchema = z.object({
  sedeId: z.string().min(1, 'Debe seleccionar una sede'),
  anio: z.string().min(4, 'Año requerido'),
  alcanceId: z.string().optional(),
  fuenteEmisionId: z.string().min(1, 'Fuente de emisión requerida'),
  subfuenteEmisionId: z.string().optional(),
  unidadEmisionId: z.string().optional(),
});

export type CarbonFootprintFormData = z.infer<typeof CarbonFootprintSchema>;

// ── UI constants ────────────────────────────────────────────────────────────

export const MODOS_CARGA = ['Mensual', 'Anual'] as const;
