import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleEditView } from '../RoleEditView';
import { RoleService } from '../../services/role.service';
import { ApiError } from '@/shared/lib/api-client';

vi.mock('../../services/role.service', () => ({
  RoleService: { getRoleById: vi.fn(), getRoleDeletionImpact: vi.fn() },
}));
vi.mock('../RoleForm', () => ({ RoleForm: () => <div>Formulario de rol</div> }));

const mockService = vi.mocked(RoleService);

describe('RoleEditView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getRoleById.mockResolvedValue({ id: 'r1', name: 'Auditor' });
    mockService.getRoleDeletionImpact.mockResolvedValue({ users: 0 });
  });

  it('debería mostrar "Rol no encontrado" ante un 404', async () => {
    mockService.getRoleById.mockRejectedValue(new ApiError('nope', 404));
    render(<RoleEditView roleId="r1" />);
    expect(await screen.findByText('Rol no encontrado')).toBeInTheDocument();
  });

  it('debería ofrecer reintentar ante otros fallos', async () => {
    mockService.getRoleById.mockRejectedValueOnce(new ApiError('boom', 500));
    render(<RoleEditView roleId="r1" />);
    expect(await screen.findByText('No pudimos cargar el rol')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByText('Formulario de rol')).toBeInTheDocument();
  });

  it('debería avisar cuántos usuarios resultarán afectados al editar', async () => {
    mockService.getRoleDeletionImpact.mockResolvedValue({ users: 3 });
    render(<RoleEditView roleId="r1" />);
    expect(await screen.findByRole('status')).toHaveTextContent('3 usuarios tienen este rol');
  });

  it('no debería mostrar el aviso cuando nadie usa el rol', async () => {
    render(<RoleEditView roleId="r1" />);
    await screen.findByText('Formulario de rol');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('debería seguir permitiendo editar si falla el conteo de usuarios', async () => {
    mockService.getRoleDeletionImpact.mockRejectedValue(new Error('fail'));
    render(<RoleEditView roleId="r1" />);
    expect(await screen.findByText('Formulario de rol')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('debería mostrar la ruta de navegación con el nombre del rol', async () => {
    render(<RoleEditView roleId="r1" />);
    const nav = await screen.findByRole('navigation', { name: 'Ruta de navegación' });
    expect(within(nav).getByRole('link', { name: 'Roles y permisos' })).toHaveAttribute('href', '/roles');
    expect(within(nav).getByText('Auditor')).toHaveAttribute('aria-current', 'page');
  });
});
