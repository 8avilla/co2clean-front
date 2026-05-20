import { apiFetch } from '@/shared/lib/api-client';
import { ApiUser, UserFormData, ApiUserCompany } from '../types';

export class UserService {
  // ── Users ──────────────────────────────────────────────────────────────────

  static async getUsers(search?: string, roleId?: string, companyId?: string): Promise<ApiUser[]> {
    const res = await apiFetch<ApiUser[]>('/api/users', {
      params: { limit: 100, search, roleId, companyId },
    });
    return res ?? [];
  }

  static async getUserById(id: string): Promise<ApiUser | null> {
    return apiFetch<ApiUser>(`/api/users/${id}`);
  }

  static async createUser(data: UserFormData): Promise<ApiUser> {
    return apiFetch<ApiUser>('/api/users', {
      method: 'POST',
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        roleId: data.isAdmin ? undefined : data.roleId,
        companyId: data.companyId || undefined,
        isSuperAdmin: data.isAdmin ?? false,
      },
    });
  }

  static async updateUser(id: string, data: Partial<UserFormData>): Promise<ApiUser> {
    return apiFetch<ApiUser>(`/api/users/${id}`, {
      method: 'PUT',
      body: {
        name: data.name,
        email: data.email,
        roleId: data.isAdmin ? undefined : data.roleId,
        companyId: data.companyId || undefined,
        isSuperAdmin: data.isAdmin ?? false,
      },
    });
  }

  static async deleteUser(id: string): Promise<void> {
    await apiFetch<void>(`/api/users/${id}`, { method: 'DELETE' });
  }

  static async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await apiFetch<void>(`/api/users/${id}/change-password`, {
      method: 'PATCH',
      body: { currentPassword, newPassword },
    });
  }

  // ── User Company Associations ──────────────────────────────────────────────

  static async getUserCompanies(userId: string): Promise<ApiUserCompany[]> {
    const res = await apiFetch<ApiUserCompany[]>(`/api/users/${userId}/companies`);
    return res ?? [];
  }

  static async associateCompany(
    userId: string,
    companyId: string,
    roleId: string,
  ): Promise<ApiUserCompany> {
    return apiFetch<ApiUserCompany>(`/api/users/${userId}/companies`, {
      method: 'POST',
      body: { companyId, roleId },
    });
  }

  static async disassociateCompany(userId: string, companyId: string): Promise<void> {
    await apiFetch<void>(`/api/users/${userId}/companies/${companyId}`, {
      method: 'DELETE',
    });
  }
}
