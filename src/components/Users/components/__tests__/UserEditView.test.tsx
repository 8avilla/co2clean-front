import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserEditView } from '../UserEditView';
import { UserService } from '../../services/user.service';
import { ApiError } from '@/shared/lib/api-client';
import type { ApiUser } from '../../types';

vi.mock('../../services/user.service', () => ({ UserService: { getUserById: vi.fn() } }));
vi.mock('../UserForm', () => ({ UserForm: () => <div>Formulario de usuario</div> }));
vi.mock('../UserCompaniesPanel', () => ({
  UserCompaniesPanel: ({ onCountChange }: { onCountChange?: (count: number) => void }) => (
    <div>
      Panel de empresas
      <button onClick={() => onCountChange?.(3)}>Simular empresas</button>
    </div>
  ),
}));

const mockService = vi.mocked(UserService);
const user: ApiUser = { id: 'u1', name: 'Ana', email: 'ana@x.co' };

describe('UserEditView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/usuarios/u1');
    mockService.getUserById.mockResolvedValue(user);
  });

  it('debería mostrar "Usuario no encontrado" ante un 404', async () => {
    mockService.getUserById.mockRejectedValue(new ApiError('nope', 404));
    render(<UserEditView userId="u1" />);
    expect(await screen.findByText('Usuario no encontrado')).toBeInTheDocument();
  });

  it('debería mostrar un error con reintento ante otros fallos', async () => {
    mockService.getUserById.mockRejectedValueOnce(new ApiError('boom', 500));
    render(<UserEditView userId="u1" />);
    expect(await screen.findByText('No pudimos cargar el usuario')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByRole('tab', { name: /Perfil/ })).toBeInTheDocument();
  });

  it('debería ofrecer las pestañas Perfil y Empresas y roles', async () => {
    render(<UserEditView userId="u1" />);
    expect(await screen.findByRole('tab', { name: /Perfil/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Empresas y roles/ })).toBeInTheDocument();
  });

  it('no debería mostrar la pestaña de empresas a un Super Administrador', async () => {
    mockService.getUserById.mockResolvedValue({ ...user, isSuperAdmin: true });
    render(<UserEditView userId="u1" />);
    await screen.findByText('Formulario de usuario');
    expect(screen.queryByRole('tab', { name: /Empresas y roles/ })).not.toBeInTheDocument();
  });

  it('debería abrir la pestaña de empresas con ?tab=empresas', async () => {
    window.history.pushState({}, '', '/usuarios/u1?tab=empresas');
    render(<UserEditView userId="u1" />);
    expect(await screen.findByRole('tab', { name: /Empresas y roles/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('debería mantener ambos paneles montados y actualizar el conteo', async () => {
    render(<UserEditView userId="u1" />);
    await userEvent.click(await screen.findByRole('tab', { name: /Empresas y roles/ }));
    expect(screen.getByText('Formulario de usuario')).toBeInTheDocument();
    expect(document.getElementById('user-panel-profile')).toHaveAttribute('hidden');

    await userEvent.click(screen.getByRole('button', { name: 'Simular empresas' }));
    await waitFor(() => expect(screen.getByRole('tab', { name: /Empresas y roles/ })).toHaveTextContent('3'));
  });

  it('debería mostrar la ruta de navegación con el nombre del usuario', async () => {
    render(<UserEditView userId="u1" />);
    const nav = await screen.findByRole('navigation', { name: 'Ruta de navegación' });
    expect(within(nav).getByRole('link', { name: 'Usuarios' })).toHaveAttribute('href', '/usuarios');
    expect(within(nav).getByText('Ana')).toHaveAttribute('aria-current', 'page');
  });
});
