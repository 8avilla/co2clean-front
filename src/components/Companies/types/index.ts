import { z } from 'zod';

// ── API response shapes ─────────────────────────────────────────────────────

export interface ApiHeadquarter {
  id: string;
  name: string;
  description?: string;
  address?: string;
  departmentId?: string;
  municipalityId?: string;
  companyId: string;
  /** Populated relations (when fetching by company) */
  department?: { id: string; name: string };
  municipality?: { id: string; name: string };
}

export interface ApiCompany {
  id: string;
  name: string;
  nit: string;
  email: string;
  description?: string;
  logoUrl?: string;
  country?: string;
  address?: string;
  departmentId?: string;
  municipalityId?: string;
  /** Populated relations */
  department?: { id: string; name: string };
  municipality?: { id: string; name: string };
  headquarters?: ApiHeadquarter[];
}

// ── Zod schemas (used in forms) ─────────────────────────────────────────────

export const CompanySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  nit: z.string().min(5, 'NIT inválido'),
  email: z.string().email('Email inválido'),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  country: z.string().optional(),
  departmentId: z.string().min(1, 'El departamento es requerido'),
  municipalityId: z.string().min(1, 'El municipio es requerido'),
  address: z.string().min(5, 'La dirección es requerida'),
});

export const HeadquarterSchema = z.object({
  id: z.string().optional(),
  companyId: z.string().optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  address: z.string().optional(),
  departmentId: z.string().optional(),
  municipalityId: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof CompanySchema>;
export type HeadquarterFormData = z.infer<typeof HeadquarterSchema>;

// Keep old aliases for components that still reference them
export type Company = ApiCompany;
export type Branch = ApiHeadquarter;
export interface CompanyWithBranches extends ApiCompany {
  sedes: ApiHeadquarter[];
}
