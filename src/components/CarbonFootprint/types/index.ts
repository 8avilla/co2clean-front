import { z } from 'zod';

// ── Standards ────────────────────────────────────────────────────────────────

export type CarbonFootprintAnalysisStandard = 'ISO_14064' | 'GHG_Protocol';

// ── Catalog API shapes ───────────────────────────────────────────────────────

export interface ApiUnitType {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface ApiEmissionGroup {
  id: string;
  name: string;
  code: string;
  description?: string;
  standard?: CarbonFootprintAnalysisStandard;
}

export interface ApiEmissionSource {
  id: string;
  name: string;
  code: string;
  description?: string;
  unitTypeId?: string;
  unitType?: ApiUnitType;
}

export interface ApiEmissionSubsource {
  id: string;
  name: string;
  code: string;
  description?: string;
  emissionSourceId?: string;
}

export interface ApiEmissionUnit {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  unitTypeId?: string;
  unitType?: ApiUnitType;
}

export interface ApiEmissionFactor {
  id: string;
  name: string;
  description?: string;
  year: number;
  value: number;
  emissionGroupId: string;
  emissionSourceId: string;
  emissionSubsourceId?: string;
  emissionUnitId: string;
  emissionGroup?: ApiEmissionGroup;
  emissionSource?: ApiEmissionSource;
  emissionSubsource?: ApiEmissionSubsource;
  emissionUnit?: ApiEmissionUnit;
}

// ── Catalog payload types ────────────────────────────────────────────────────

export interface CreateUnitTypePayload {
  name: string;
  code: string;
  description?: string;
}

export type UpdateUnitTypePayload = Partial<CreateUnitTypePayload>;

export interface CreateEmissionGroupPayload {
  name: string;
  code: string;
  standard: CarbonFootprintAnalysisStandard;
  description?: string;
}

export type UpdateEmissionGroupPayload = Partial<CreateEmissionGroupPayload>;

export interface CreateEmissionSourcePayload {
  name: string;
  code: string;
  unitTypeId?: string;
  description?: string;
}

export type UpdateEmissionSourcePayload = Partial<CreateEmissionSourcePayload>;

export interface CreateEmissionSubsourcePayload {
  name: string;
  code: string;
  description?: string;
  emissionSourceId?: string;
}

export type UpdateEmissionSubsourcePayload = Partial<CreateEmissionSubsourcePayload>;

export interface CreateEmissionUnitPayload {
  name: string;
  symbol: string;
  unitTypeId?: string;
  description?: string;
}

export type UpdateEmissionUnitPayload = Partial<CreateEmissionUnitPayload>;

export interface CreateEmissionFactorPayload {
  name: string;
  description?: string;
  year: number;
  emissionGroupId: string;
  emissionSourceId: string;
  emissionSubsourceId?: string;
  emissionUnitId: string;
  value: number;
}

export type UpdateEmissionFactorPayload = Partial<CreateEmissionFactorPayload>;

// ── Carbon Footprint API shapes ──────────────────────────────────────────────

export interface ApiCarbonFootprint {
  id: string;
  year: number;
  item?: string;
  quantity?: number;
  loadMode: 'Monthly' | 'Annual';
  headquarterId: string;
  companyId: string;
  emissionGroupId?: string;
  emissionSourceId: string;
  emissionSubsourceId?: string;
  emissionUnitId?: string;
  createdAt: string;
  emissionGroup?: ApiEmissionGroup;
  emissionSource?: ApiEmissionSource;
  emissionSubsource?: ApiEmissionSubsource;
  emissionUnit?: ApiEmissionUnit;
}

// ── Service interfaces ───────────────────────────────────────────────────────

export interface CarbonFootprintFilters {
  companyId: string;
  year?: number;
  headquarterId?: string;
  emissionGroupId?: string;
  emissionSourceId?: string;
  emissionSubsourceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface UploadCsvParams {
  year: string;
  nit: string;
  headquarterId: string;
  emissionGroupId: string;
  emissionSourceId: string;
  emissionSubsourceId?: string;
  emissionUnitId?: string;
}

export interface UpdateCarbonFootprintPayload {
  year?: number;
  item?: string;
  quantity?: number;
  emissionGroupId?: string;
  emissionSourceId?: string;
  emissionSubsourceId?: string;
  emissionUnitId?: string;
  loadMode?: 'Monthly' | 'Annual';
}

// ── Zod schema for upload form ───────────────────────────────────────────────

export const CarbonFootprintSchema = z.object({
  headquarterId: z.string().min(1, 'Debe seleccionar una sede'),
  year: z.string().min(4, 'Año requerido'),
  emissionGroupId: z.string().min(1, 'Debe seleccionar un grupo de emisiones'),
  emissionSourceId: z.string().min(1, 'Fuente de emisión requerida'),
  emissionSubsourceId: z.string().min(1, 'Subfuente de emisión requerida'),
  emissionUnitId: z.string().optional(),
});

export type CarbonFootprintFormData = z.infer<typeof CarbonFootprintSchema>;

// ── Carbon Footprint Analysis shapes ────────────────────────────────────────

export type CarbonFootprintAnalysisStatus = 'NotStarted' | 'Processing' | 'Successful' | 'Deleted';

export interface ApiCarbonFootprintAnalysis {
  id: string;
  companyId: string;
  year: number;
  status: CarbonFootprintAnalysisStatus;
  standard?: CarbonFootprintAnalysisStandard;
  reportUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCarbonFootprintAnalysisPayload {
  companyId: string;
  year: number;
  standard: CarbonFootprintAnalysisStandard;
}

export interface UpdateCarbonFootprintAnalysisPayload {
  status?: CarbonFootprintAnalysisStatus;
  reportUrl?: string;
}

export interface CarbonFootprintAnalysisFilters {
  companyId?: string;
  year?: number;
  status?: CarbonFootprintAnalysisStatus;
  page?: number;
  limit?: number;
}

// ── UI constants ─────────────────────────────────────────────────────────────

export const LOAD_MODES = ['Monthly', 'Annual'] as const;
export type LoadMode = typeof LOAD_MODES[number];
