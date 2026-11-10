import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '@/components/Users/services/user.service';
import { RoleService } from '../role.service';

vi.mock('@/shared/lib/api-client', () => ({ apiFetch: vi.fn() }));
vi.mock('@/components/Users/services/user.service', () => ({ UserService: { getUsers: vi.fn() } }));

describe('RoleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRoleDeletionImpact debería contar los usuarios que tienen el rol', async () => {
    vi.mocked(UserService.getUsers).mockResolvedValue(
      Array(4).fill({}) as Awaited<ReturnType<typeof UserService.getUsers>>,
    );
    await expect(RoleService.getRoleDeletionImpact('r1')).resolves.toEqual({ users: 4 });
    expect(UserService.getUsers).toHaveBeenCalledWith(undefined, 'r1');
  });
});
