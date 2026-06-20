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

// Represents /api/emission-source-categories
export interface ApiEmissionSource {
  id: string;
  name: string;
  code: string;
  description?: string;
  emissionGroupId?: string;
  isActive?: boolean;
}

export interface ApiCommercialUnit {
  id: string;
  displaySymbol: string;
  displayName: string;
  conversionFactor: number;
  baseUnitSymbol: string;
  emissionUnitId?: string;
}

// Represents /api/emission-sources
export interface ApiEmissionSubsource {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  emissionSourceCategoryId?: string | null;
  unitTypeId?: string | null;
  unitType?: ApiUnitType | null;
  isActive?: boolean;
  allowedUnits?: ApiCommercialUnit[];
}

export interface ApiEmissionUnit {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  unitTypeId?: string;
  unitType?: ApiUnitType;
}

export type FactorMassUnit = 'kg' | 'g' | 'mg';

// Converts factorMassUnit to kg so all calculations use consistent units
export const FACTOR_MASS_UNIT_TO_KG: Record<FactorMassUnit, number> = {
  kg: 1,
  g: 0.001,
  mg: 0.000001,
};

// Aligned with GasFactor (/api/emission-factors)
export interface ApiEmissionFactor {
  id: string;
  name?: string;
  description?: string;
  gasId: string;
  gas?: { id: string; chemicalName: string; formula: string; gwp: number };
  factor: number;
  factorMassUnit?: FactorMassUnit;
  emissionUnitId: string;
  emissionUnit?: ApiEmissionUnit;
  uncertainty?: number;
  gwp: number;
  emissionGroupId?: string;
  emissionGroup?: ApiEmissionGroup;
  emissionSourceId: string;
  emissionSourceCategoryId: string;
  emissionSourceCategory?: ApiEmissionSource;
  emissionSource?: ApiEmissionSubsource;
  emissionSubsource?: ApiEmissionSubsource;
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
  emissionGroupId?: string;
  description?: string;
}

export type UpdateEmissionSourcePayload = Partial<CreateEmissionSourcePayload>;

export interface CreateEmissionSubsourcePayload {
  name: string;
  code: string;
  description?: string;
  emissionSourceCategoryId?: string;
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
  gasId: string;
  factor: number;
  factorMassUnit?: FactorMassUnit;
  emissionUnitId: string;
  uncertainty?: number;
  gwp: number;
  emissionSourceId: string;
  emissionSourceCategoryId: string;
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
  emissionSourceCategoryId?: string;
  emissionSubsourceId?: string;
  emissionUnitId?: string;
  createdAt: string;
  emissionGroup?: ApiEmissionGroup;
  emissionSourceCategory?: ApiEmissionSource;
  emissionSource?: ApiEmissionSubsource;
  emissionUnit?: ApiEmissionUnit;
}

// ── Service interfaces ───────────────────────────────────────────────────────

export interface CarbonFootprintFilters {
  companyId: string;
  year?: number;
  headquarterId?: string;
  emissionGroupId?: string;
  emissionSourceCategoryId?: string;
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
  emissionSourceCategoryId: string;
  emissionSubsourceId?: string;
  emissionUnitId?: string;
  emissionUnitSymbol?: string;
}

export interface UpdateCarbonFootprintPayload {
  year?: number;
  item?: string;
  quantity?: number;
  emissionGroupId?: string;
  emissionSourceCategoryId?: string;
  emissionSubsourceId?: string;
  emissionUnitId?: string;
  loadMode?: 'Monthly' | 'Annual';
}

// ── Zod schema for upload form ───────────────────────────────────────────────

export const CarbonFootprintSchema = z.object({
  headquarterId: z.string().min(1, 'Debe seleccionar una sede'),
  year: z.string().min(4, 'Año requerido'),
  emissionGroupId: z.string().min(1, 'Debe seleccionar un grupo de emisiones'),
  emissionSourceCategoryId: z.string().min(1, 'Fuente de emisión requerida'),
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
