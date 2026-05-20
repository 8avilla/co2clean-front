import { z } from 'zod';

/**
 * Login schema for validation using Zod.
 * Enforces email format and minimum password length.
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El correo electrónico es requerido' })
    .email({ message: 'Ingrese un correo electrónico válido' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof LoginSchema>;

import { ApiCompany } from '@/components/Companies/types';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    company: ApiCompany | null;
    currentCompanyId?: string | null;
    companies?: ApiCompany[];
    permissions?: string[];
    isSuperAdmin?: boolean;
  };
}
