import { apiFetch } from '@/shared/lib/api-client';
import { ApiRole, ApiPermission, RoleFormData } from '../types';

export class RoleService {
  // ── Roles ──────────────────────────────────────────────────────────────────

  static async getRoles(search?: string, companyId?: string): Promise<ApiRole[]> {
    const res = await apiFetch<ApiRole[]>('/api/roles', {
      params: { limit: 100, search, companyId },
    });
    return res ?? [];
  }

  static async getRoleById(id: string): Promise<ApiRole | null> {
    return apiFetch<ApiRole>(`/api/roles/${id}`);
  }

  static async createRole(data: RoleFormData): Promise<ApiRole> {
    return apiFetch<ApiRole>('/api/roles', {
      method: 'POST',
      body: {
        name: data.name,
        description: data.description || undefined,
        permissionIds: data.permissionIds,
      },
    });
  }

  static async updateRole(id: string, data: Partial<RoleFormData>): Promise<ApiRole> {
    return apiFetch<ApiRole>(`/api/roles/${id}`, {
      method: 'PUT',
      body: {
        name: data.name,
        description: data.description || undefined,
        permissionIds: data.permissionIds,
      },
    });
  }

  static async deleteRole(id: string): Promise<void> {
    await apiFetch<void>(`/api/roles/${id}`, { method: 'DELETE' });
  }

  // ── Permissions ────────────────────────────────────────────────────────────

  static async getPermissions(search?: string): Promise<ApiPermission[]> {
    const res = await apiFetch<ApiPermission[]>('/api/permissions', {
      params: { limit: 100, search },
    });
    return res ?? [];
  }
}
