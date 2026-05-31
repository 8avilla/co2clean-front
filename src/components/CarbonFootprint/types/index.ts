import { z } from 'zod';

// ── Standards ───────────────────────────────────────────────────────────────

export type CarbonFootprintAnalysisStandard = 'ISO_14064' | 'GHG_Protocol';

// ── Catalog API shapes ──────────────────────────────────────────────────────

export interface ApiTipoUnidad {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
}

export interface ApiGrupoEmision {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  standard?: CarbonFootprintAnalysisStandard;
}

export interface ApiFuenteEmision {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  tipoUnidadId?: string;
  tipoUnidad?: ApiTipoUnidad;
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
  tipoUnidadId?: string;
  tipoUnidad?: ApiTipoUnidad;
}

export interface ApiEmissionFactor {
  id: string;
  nombre: string;
  descripcion?: string;
  anio: number;
  valor: number;
  grupoEmisionId: string;
  fuenteEmisionId: string;
  subfuenteEmisionId?: string;
  unidadEmisionId: string;
  grupoEmision?: ApiGrupoEmision;
  fuenteEmision?: ApiFuenteEmision;
  subfuenteEmision?: ApiSubfuenteEmision;
  unidadEmision?: ApiUnidadEmision;
}

// ── Catalog payload types ───────────────────────────────────────────────────

export interface CreateGrupoEmisionPayload {
  nombre: string;
  codigo: string;
  standard: CarbonFootprintAnalysisStandard;
  descripcion?: string;
}

export type UpdateGrupoEmisionPayload = Partial<CreateGrupoEmisionPayload>;

export interface CreateTipoUnidadPayload {
  nombre: string;
  codigo: string;
  descripcion?: string;
}

export type UpdateTipoUnidadPayload = Partial<CreateTipoUnidadPayload>;

export interface CreateFuenteEmisionPayload {
  nombre: string;
  codigo: string;
  descripcion?: string;
  tipoUnidadId?: string;
}

export type UpdateFuenteEmisionPayload = Partial<CreateFuenteEmisionPayload>;

export interface CreateSubfuenteEmisionPayload {
  nombre: string;
  codigo: string;
  descripcion?: string;
  fuenteEmisionId?: string;
}

export type UpdateSubfuenteEmisionPayload = Partial<CreateSubfuenteEmisionPayload>;

export interface CreateUnidadEmisionPayload {
  nombre: string;
  simbolo: string;
  descripcion?: string;
  tipoUnidadId?: string;
}

export type UpdateUnidadEmisionPayload = Partial<CreateUnidadEmisionPayload>;

export interface CreateEmissionFactorPayload {
  nombre: string;
  descripcion?: string;
  anio: number;
  grupoEmisionId: string;
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
  grupoEmisionId?: string;
  fuenteEmisionId: string;
  subfuenteEmisionId?: string;
  unidadEmisionId?: string;
  createdAt: string;
  grupoEmision?: ApiGrupoEmision;
  fuenteEmision?: ApiFuenteEmision;
  subfuenteEmision?: ApiSubfuenteEmision;
  unidadEmision?: ApiUnidadEmision;
}

// ── Service interfaces ──────────────────────────────────────────────────────

export interface CarbonFootprintFilters {
  empresaId: string;
  anio?: number;
  sedeId?: string;
  grupoEmisionId?: string;
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
  grupoEmisionId?: string;
  fuenteEmisionId: string;
  subfuenteEmisionId?: string;
  unidadEmisionId?: string;
  modoCarga?: 'Mensual' | 'Anual';
}

export interface UpdateCarbonFootprintPayload {
  anio?: number;
  item?: string;
  cantidad?: number;
  grupoEmisionId?: string;
  fuenteEmisionId?: string;
  subfuenteEmisionId?: string;
  unidadEmisionId?: string;
  modoCarga?: 'Mensual' | 'Anual';
}

// ── Zod schema for upload form ──────────────────────────────────────────────

export const CarbonFootprintSchema = z.object({
  sedeId: z.string().min(1, 'Debe seleccionar una sede'),
  anio: z.string().min(4, 'Año requerido'),
  grupoEmisionId: z.string().optional(),
  fuenteEmisionId: z.string().min(1, 'Fuente de emisión requerida'),
  subfuenteEmisionId: z.string().optional(),
  unidadEmisionId: z.string().optional(),
});

export type CarbonFootprintFormData = z.infer<typeof CarbonFootprintSchema>;

// ── Carbon Footprint Analysis shapes ───────────────────────────────────────

export type CarbonFootprintAnalysisStatus = 'WithoutStarting' | 'Processing' | 'Successful';

export interface ApiCarbonFootprintAnalysis {
  id: string;
  empresaId: string;
  anio: number;
  estado: CarbonFootprintAnalysisStatus;
  standard?: CarbonFootprintAnalysisStandard;
  urlInforme?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCarbonFootprintAnalysisPayload {
  empresaId: string;
  anio: number;
  standard: CarbonFootprintAnalysisStandard;
}

export interface UpdateCarbonFootprintAnalysisPayload {
  estado?: CarbonFootprintAnalysisStatus;
  urlInforme?: string;
}

export interface CarbonFootprintAnalysisFilters {
  empresaId?: string;
  anio?: number;
  estado?: CarbonFootprintAnalysisStatus;
  page?: number;
  limit?: number;
}

// ── UI constants ────────────────────────────────────────────────────────────

export const MODOS_CARGA = ['Mensual', 'Anual'] as const;
