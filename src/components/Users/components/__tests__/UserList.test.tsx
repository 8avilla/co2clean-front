import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserList } from '../UserList';
import { UserService } from '../../services/user.service';
import { confirmDelete } from '@/shared/lib/confirm-dialog';
import { AuthService } from '@/components/Auth/services/auth.service';
import type { ApiUser } from '../../types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/hooks/usePermission', () => ({
  usePermission: () => ({ hasPermission: () => true }),
}));
vi.mock('@/shared/lib/confirm-dialog', () => ({ confirmDelete: vi.fn() }));
vi.mock('@/components/Auth/services/auth.service', () => ({ AuthService: { logout: vi.fn() } }));
vi.mock('../../services/user.service', () => ({
  UserService: {
    getUsers: vi.fn(),
    getUserDeletionImpact: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

const mockService = vi.mocked(UserService);
const mockConfirmDelete = vi.mocked(confirmDelete);

const users: ApiUser[] = [
  { id: 'u1', name: 'Ana Pérez', email: 'ana@ecocore.co', role: { id: 'r1', name: 'Administrador' } },
  { id: 'u2', name: 'Carlos Ruiz', email: 'carlos@camara.co', role: { id: 'r2', name: 'Auditor' } },
  { id: 'u3', name: 'Root', email: 'root@ecocore.co', isSuperAdmin: true },
];

const renderList = async () => {
  render(<UserList />);
  await waitFor(() => expect(screen.queryAllByText('Ana Pérez').length).toBeGreaterThan(0));
};

const getTable = () => screen.getByRole('table');

describe('UserList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockService.getUsers.mockResolvedValue(users);
  });

  it('debería mostrar el rol de cada usuario y la insignia de Super Administrador', async () => {
    await renderList();
    const table = getTable();
    expect(within(table).getByText('Administrador')).toBeInTheDocument();
    expect(within(table).getByText('Super Administrador')).toBeInTheDocument();
  });

  it('debería buscar por correo, rol y sin importar tildes', async () => {
    await renderList();
    const input = screen.getByPlaceholderText(/Buscar por nombre, correo, rol o empresa/);

    await userEvent.type(input, 'perez');
    await waitFor(() => expect(within(getTable()).queryByText('Carlos Ruiz')).not.toBeInTheDocument());

    await userEvent.clear(input);
    await userEvent.type(input, 'auditor');
    await waitFor(() => expect(within(getTable()).queryByText('Ana Pérez')).not.toBeInTheDocument());
    expect(within(getTable()).getByText('Carlos Ruiz')).toBeInTheDocument();
  });

  it('debería filtrar por rol', async () => {
    await renderList();
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }));
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'Auditor');
    await waitFor(() => expect(within(getTable()).queryByText('Ana Pérez')).not.toBeInTheDocument());
    expect(within(getTable()).getByText('Carlos Ruiz')).toBeInTheDocument();
  });

  it('debería ordenar por nombre al pulsar la cabecera', async () => {
    await renderList();
    await userEvent.click(within(getTable()).getByRole('button', { name: /Usuario/ }));
    const rows = within(getTable()).getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Root')).toBeInTheDocument();
  });

  it('debería advertir de las empresas asociadas antes de eliminar', async () => {
    mockService.getUserDeletionImpact.mockResolvedValue({ companies: 2 });
    mockConfirmDelete.mockResolvedValue(false);
    await renderList();

    await userEvent.click(within(getTable()).getByRole('button', { name: 'Eliminar Ana Pérez' }));

    await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());
    expect(mockConfirmDelete.mock.calls[0][0].html).toContain('2 empresas');
    expect(mockService.deleteUser).not.toHaveBeenCalled();
  });

  it('debería avisar cuando el usuario se elimina a sí mismo y cerrar la sesión', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u1' }));
    mockService.getUserDeletionImpact.mockResolvedValue({ companies: 0 });
    mockConfirmDelete.mockResolvedValue(true);
    mockService.deleteUser.mockResolvedValue(undefined);
    const hrefSetter = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, set href(value: string) { hrefSetter(value); } },
    });

    await renderList();
    await userEvent.click(within(getTable()).getByRole('button', { name: 'Eliminar Ana Pérez' }));

    await waitFor(() => expect(mockService.deleteUser).toHaveBeenCalledWith('u1'));
    expect(mockConfirmDelete.mock.calls[0][0].html).toContain('tu propia cuenta');
    expect(AuthService.logout).toHaveBeenCalled();
    expect(hrefSetter).toHaveBeenCalledWith('/login');

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('debería pedir confirmación simple si falla el cálculo del impacto', async () => {
    mockService.getUserDeletionImpact.mockRejectedValue(new Error('fail'));
    mockConfirmDelete.mockResolvedValue(false);
    await renderList();

    await userEvent.click(within(getTable()).getByRole('button', { name: 'Eliminar Carlos Ruiz' }));

    await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());
    expect(mockConfirmDelete.mock.calls[0][0].html).toContain('Carlos Ruiz');
  });

  it('debería mostrar un estado de error con opción de reintentar', async () => {
    mockService.getUsers.mockRejectedValueOnce(new Error('network'));
    render(<UserList />);
    await userEvent.click(await screen.findByRole('button', { name: /Reintentar/ }));
    await waitFor(() => expect(screen.queryAllByText('Ana Pérez').length).toBeGreaterThan(0));
  });

  it('debería mostrar los botones de acción sin depender del hover', async () => {
    await renderList();
    const editLink = within(getTable()).getByRole('link', { name: 'Editar Ana Pérez' });
    expect(editLink.closest('div')?.className).not.toContain('opacity-0');
  });
});
