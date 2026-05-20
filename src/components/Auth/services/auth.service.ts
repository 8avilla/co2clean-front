import { apiFetch } from '@/shared/lib/api-client';
import Cookies from 'js-cookie';
import { LoginFormData, AuthResponse } from '../types';

/**
 * Service for handling authentication logic.
 * Encapsulates API calls related to user identity.
 */
export class AuthService {
  static async login(data: LoginFormData): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: {
        email: data.email,
        password: data.password,
      },
    });
  }

  static logout() {
    Cookies.remove('auth-token');
    localStorage.removeItem('user');
  }

  static async switchCompany(companyId: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/api/auth/switch-company', {
      method: 'POST',
      body: { companyId },
    });
  }

  /**
   * Fetches the resolved permission codes for a user in a given company.
   * Useful for refreshing permissions without a full re-login.
   */
  static async getPermissions(userId: string, companyId: string): Promise<string[]> {
    const res = await apiFetch<string[]>('/api/auth/permissions', {
      params: { userId, companyId },
    });
    return res ?? [];
  }
}
