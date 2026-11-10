import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleList } from '../RoleList';
import { RoleService } from '../../services/role.service';
import { UserService } from '@/components/Users/services/user.service';
import { confirmDelete } from '@/shared/lib/confirm-dialog';
import type { ApiRole } from '../../types';
import type { ApiUser } from '@/components/Users/types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/hooks/usePermission', () => ({
  usePermission: () => ({ hasPermission: () => true }),
}));
vi.mock('@/shared/lib/confirm-dialog', () => ({ confirmDelete: vi.fn() }));
vi.mock('../../services/role.service', () => ({
  RoleService: { getRoles: vi.fn(), getRoleDeletionImpact: vi.fn(), deleteRole: vi.fn() },
}));
vi.mock('@/components/Users/services/user.service', () => ({ UserService: { getUsers: vi.fn() } }));

const mockRoles = vi.mocked(RoleService);
const mockUsers = vi.mocked(UserService);
const mockConfirmDelete = vi.mocked(confirmDelete);

const roles: ApiRole[] = [
  {
    id: 'r1',
    name: 'Administrador',
    description: 'Acceso total',
    permissions: [
      { id: 'p1', name: 'Ver usuarios', code: 'VIEW_USERS' },
      { id: 'p2', name: 'Gestionar roles', code: 'MANAGE_ROLES' },
    ],
  },
  { id: 'r2', name: 'Auditor', description: 'Solo lectura', permissions: [{ id: 'p3', name: 'Ver reportes', code: 'VIEW_REPORTS' }] },
  { id: 'r3', name: 'Vacío', description: 'Sin permisos', permissions: [] },
];

const users = [
  { id: 'u1', name: 'A', email: 'a', roleId: 'r1' },
  { id: 'u2', name: 'B', email: 'b', roleId: 'r1' },
] as ApiUser[];

const renderList = async () => {
  render(<RoleList />);
  await waitFor(() => expect(screen.getByText('Administrador')).toBeInTheDocument());
};

describe('RoleList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoles.getRoles.mockResolvedValue(roles);
    mockUsers.getUsers.mockResolvedValue(users);
  });

  it('debería mostrar cuántos usuarios tiene cada rol', async () => {
    await renderList();
    expect(screen.getByText('2 usuarios')).toBeInTheDocument();
    expect(screen.getAllByText('Sin usuarios').length).toBe(2);
  });

  it('debería seguir mostrando los roles si falla la carga de usuarios', async () => {
    mockUsers.getUsers.mockRejectedValue(new Error('fail'));
    await renderList();
    expect(screen.queryByText('2 usuarios')).not.toBeInTheDocument();
  });

  it('debería avisar de los roles sin permisos', async () => {
    await renderList();
    expect(screen.getByText('Sin permisos asignados')).toBeInTheDocument();
  });

  it('debería buscar por módulo con acceso', async () => {
    await renderList();
    await userEvent.type(screen.getByPlaceholderText(/Buscar por nombre, descripción o módulo/), 'reportes');
    await waitFor(() => expect(screen.queryByText('Administrador')).not.toBeInTheDocument());
    expect(screen.getByText('Auditor')).toBeInTheDocument();
  });

  it('debería ordenar por nombre al pulsar la cabecera', async () => {
    await renderList();
    await userEvent.click(screen.getByRole('button', { name: /^Rol/ }));
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Vacío')).toBeInTheDocument();
  });

  it('debería advertir de los usuarios afectados antes de eliminar', async () => {
    mockRoles.getRoleDeletionImpact.mockResolvedValue({ users: 2 });
    mockConfirmDelete.mockResolvedValue(false);
    await renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Administrador' }));

    await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());
    expect(mockConfirmDelete.mock.calls[0][0].html).toContain('2 usuarios lo tienen');
    expect(mockRoles.deleteRole).not.toHaveBeenCalled();
  });

  it('debería eliminar el rol cuando el usuario confirma', async () => {
    mockRoles.getRoleDeletionImpact.mockResolvedValue({ users: 0 });
    mockConfirmDelete.mockResolvedValue(true);
    mockRoles.deleteRole.mockResolvedValue(undefined);
    await renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Auditor' }));

    await waitFor(() => expect(mockRoles.deleteRole).toHaveBeenCalledWith('r2'));
  });

  it('debería pedir confirmación simple si falla el cálculo del impacto', async () => {
    mockRoles.getRoleDeletionImpact.mockRejectedValue(new Error('fail'));
    mockConfirmDelete.mockResolvedValue(false);
    await renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Auditor' }));

    await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());
    expect(mockConfirmDelete.mock.calls[0][0].html).toContain('Auditor');
  });

  it('debería mostrar un estado de error con opción de reintentar', async () => {
    mockRoles.getRoles.mockRejectedValueOnce(new Error('network'));
    render(<RoleList />);
    await userEvent.click(await screen.findByRole('button', { name: /Reintentar/ }));
    await waitFor(() => expect(screen.getByText('Administrador')).toBeInTheDocument());
  });

  it('debería mostrar las acciones sin depender del hover', async () => {
    await renderList();
    const link = screen.getByRole('link', { name: 'Configurar permisos de Administrador' });
    expect(link.closest('div')?.className).not.toContain('opacity-0');
  });
});
