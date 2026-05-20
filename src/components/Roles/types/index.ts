import { z } from 'zod';

// ── API response shapes ─────────────────────────────────────────────────────

export interface ApiPermission {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface ApiRole {
  id: string;
  name: string;
  description?: string;
  permissions?: ApiPermission[];
}

// ── Zod schemas (used in forms) ─────────────────────────────────────────────

export const RoleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe ser más detallada').optional().or(z.literal('')),
  permissionIds: z.array(z.string()).min(1, 'Asigne al menos un permiso'),
});

export type RoleFormData = z.infer<typeof RoleSchema>;

// Keep Role as alias for backwards-compat in components
export type Role = ApiRole;
