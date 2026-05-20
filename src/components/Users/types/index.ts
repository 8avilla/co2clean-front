import { z } from 'zod';

// ── API response shapes ─────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  companyId?: string;
  isSuperAdmin?: boolean;
  /** Populated relations */
  role?: { id: string; name: string };
  company?: { id: string; name: string; nit: string };
}

export interface ApiUserCompany {
  id: string;
  userId: string;
  companyId: string;
  roleId: string;
  company: { id: string; name: string; nit: string };
  role: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

// ── Zod schemas (used in forms) ─────────────────────────────────────────────

export const UserSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
    isAdmin: z.boolean().optional(),
    roleId: z.string().optional(),
    companyId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isAdmin && (!data.roleId || data.roleId === '')) {
      ctx.addIssue({
        code: 'custom',
        message: 'Seleccione un rol',
        path: ['roleId'],
      });
    }
  });

export type UserFormData = z.infer<typeof UserSchema>;

// Keep backwards-compatible aliases
export type User = ApiUser;
export interface UserWithCompany extends ApiUser {
  companyName?: string;
}
