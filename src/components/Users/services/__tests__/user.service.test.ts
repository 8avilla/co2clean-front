import { vi, describe, it, expect, beforeEach } from 'vitest';
import { apiFetch } from '@/shared/lib/api-client';
import { UserService } from '../user.service';

vi.mock('@/shared/lib/api-client', () => ({ apiFetch: vi.fn() }));

const mockApiFetch = vi.mocked(apiFetch);

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getUserDeletionImpact debería contar las empresas asociadas', async () => {
    mockApiFetch.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    await expect(UserService.getUserDeletionImpact('u1')).resolves.toEqual({ companies: 2 });
    expect(mockApiFetch).toHaveBeenCalledWith('/api/users/u1/companies');
  });

  it('getUsers debería pedir hasta 1000 usuarios con los filtros', async () => {
    mockApiFetch.mockResolvedValue([]);
    await UserService.getUsers('ana', 'r1', 'c1');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/users', {
      params: { limit: 1000, search: 'ana', roleId: 'r1', companyId: 'c1' },
    });
  });
});
