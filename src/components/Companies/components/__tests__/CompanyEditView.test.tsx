import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyEditView } from '../CompanyEditView';
import { CompanyService } from '../../services/company.service';
import { ApiError } from '@/shared/lib/api-client';
import type { ApiCompany } from '../../types';

vi.mock('../../services/company.service', () => ({
  CompanyService: { getCompanyById: vi.fn(), getHeadquarters: vi.fn() },
}));
vi.mock('../CompanyForm', () => ({
  CompanyForm: () => <div>Formulario de empresa</div>,
}));
vi.mock('../BranchList', () => ({
  BranchList: ({ onCountChange }: { onCountChange?: (count: number) => void }) => (
    <div>
      Lista de sedes
      <button onClick={() => onCountChange?.(4)}>Simular sedes</button>
    </div>
  ),
}));

const mockService = vi.mocked(CompanyService);
const company: ApiCompany = { id: 'c1', name: 'EcoCore SAS', nit: '890.903.938-8', email: 'a@b.co' };

describe('CompanyEditView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/empresas/c1');
    mockService.getCompanyById.mockResolvedValue(company);
    mockService.getHeadquarters.mockResolvedValue([]);
  });

  it('debería mostrar "Empresa no encontrada" ante un 404', async () => {
    mockService.getCompanyById.mockRejectedValue(new ApiError('not found', 404));
    render(<CompanyEditView companyId="c1" />);
    expect(await screen.findByText('Empresa no encontrada')).toBeInTheDocument();
  });

  it('debería mostrar un error con reintento cuando falla por otra causa', async () => {
    mockService.getCompanyById.mockRejectedValueOnce(new ApiError('boom', 500));
    render(<CompanyEditView companyId="c1" />);

    expect(await screen.findByText('No pudimos cargar la empresa')).toBeInTheDocument();
    expect(screen.queryByText('Empresa no encontrada')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByRole('tab', { name: /Datos de la empresa/ })).toBeInTheDocument();
  });

  it('debería mostrar el conteo de sedes en la pestaña', async () => {
    mockService.getHeadquarters.mockResolvedValue([
      { id: 'h1', name: 'Norte', companyId: 'c1' },
      { id: 'h2', name: 'Sur', companyId: 'c1' },
    ]);
    render(<CompanyEditView companyId="c1" />);
    const tab = await screen.findByRole('tab', { name: /Sedes/ });
    expect(tab).toHaveTextContent('2');
  });

  it('debería abrir la pestaña de sedes cuando la URL trae ?tab=sedes', async () => {
    window.history.pushState({}, '', '/empresas/c1?tab=sedes');
    render(<CompanyEditView companyId="c1" />);
    const tab = await screen.findByRole('tab', { name: /Sedes/ });
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  it('debería mantener ambos paneles montados al cambiar de pestaña', async () => {
    render(<CompanyEditView companyId="c1" />);
    await screen.findByRole('tab', { name: /Sedes/ });

    await userEvent.click(screen.getByRole('tab', { name: /Sedes/ }));

    expect(screen.getByText('Formulario de empresa')).toBeInTheDocument();
    expect(document.getElementById('company-panel-info')).toHaveAttribute('hidden');
    expect(document.getElementById('company-panel-headquarters')).not.toHaveAttribute('hidden');
  });

  it('debería actualizar el conteo cuando cambian las sedes', async () => {
    render(<CompanyEditView companyId="c1" />);
    await userEvent.click(await screen.findByRole('tab', { name: /Sedes/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Simular sedes' }));
    await waitFor(() => expect(screen.getByRole('tab', { name: /Sedes/ })).toHaveTextContent('4'));
  });

  it('debería mostrar la ruta de navegación con el nombre de la empresa', async () => {
    render(<CompanyEditView companyId="c1" />);
    const nav = await screen.findByRole('navigation', { name: 'Ruta de navegación' });
    expect(within(nav).getByRole('link', { name: 'Empresas' })).toHaveAttribute('href', '/empresas');
    expect(within(nav).getByText('EcoCore SAS')).toHaveAttribute('aria-current', 'page');
  });
});
