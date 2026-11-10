import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyList } from '../CompanyList';
import { CompanyService } from '../../services/company.service';
import { confirmDelete } from '@/shared/lib/confirm-dialog';
import type { ApiCompany, ApiHeadquarter } from '../../types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/hooks/usePermission', () => ({
  usePermission: () => ({ hasPermission: () => true }),
}));
vi.mock('@/shared/lib/confirm-dialog', () => ({ confirmDelete: vi.fn() }));
vi.mock('../../services/company.service', () => ({
  CompanyService: {
    getCompanies: vi.fn(),
    getHeadquarters: vi.fn(),
    getCompanyDeletionImpact: vi.fn(),
    deleteCompany: vi.fn(),
  },
}));

const mockService = vi.mocked(CompanyService);
const mockConfirmDelete = vi.mocked(confirmDelete);

const companies: ApiCompany[] = [
  { id: 'c1', name: 'EcoCore SAS', nit: '890.903.938-8', email: 'info@ecocore.co' },
  { id: 'c2', name: 'Cámara Verde', nit: '900.123.456-8', email: 'hola@camara.co' },
];

const headquarters = [
  { id: 'h1', name: 'Norte', companyId: 'c1' },
  { id: 'h2', name: 'Sur', companyId: 'c1' },
] as ApiHeadquarter[];

const renderList = async () => {
  render(<CompanyList />);
  await waitFor(() => expect(screen.queryAllByText('EcoCore SAS').length).toBeGreaterThan(0));
};

// The list renders a mobile and a desktop view; scope queries to the table
const getTable = () => screen.getByRole('table');

describe('CompanyList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getCompanies.mockResolvedValue(companies);
    mockService.getHeadquarters.mockResolvedValue(headquarters);
  });

  it('debería mostrar el conteo de sedes por empresa', async () => {
    await renderList();
    const table = getTable();
    expect(within(table).getByText('2 sedes')).toBeInTheDocument();
  });

  it('debería marcar las empresas sin sedes y mostrar el aviso general', async () => {
    await renderList();
    expect(within(getTable()).getByText('Sin sedes')).toBeInTheDocument();
    expect(screen.getByText(/1 empresa no tiene sedes/)).toBeInTheDocument();
  });

  it('debería buscar por NIT sin importar los puntos', async () => {
    await renderList();
    await userEvent.type(screen.getByPlaceholderText(/Buscar por nombre, NIT o correo/), '900123456');
    await waitFor(() => {
      expect(within(getTable()).queryByText('EcoCore SAS')).not.toBeInTheDocument();
    });
    expect(within(getTable()).getByText('Cámara Verde')).toBeInTheDocument();
  });

  it('debería buscar por nombre sin importar las tildes', async () => {
    await renderList();
    await userEvent.type(screen.getByPlaceholderText(/Buscar por nombre, NIT o correo/), 'camara');
    await waitFor(() => {
      expect(within(getTable()).queryByText('EcoCore SAS')).not.toBeInTheDocument();
    });
  });

  it('debería ordenar por nombre al pulsar la cabecera', async () => {
    await renderList();
    const header = within(getTable()).getByRole('button', { name: /Empresa/ });
    await userEvent.click(header);
    const rows = within(getTable()).getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('EcoCore SAS')).toBeInTheDocument();
  });

  it('debería advertir de los datos asociados antes de eliminar', async () => {
    mockService.getCompanyDeletionImpact.mockResolvedValue({
      headquarters: 2,
      activityRecords: 40,
      analyses: 1,
    });
    mockConfirmDelete.mockResolvedValue(false);
    await renderList();

    await userEvent.click(within(getTable()).getByRole('button', { name: 'Eliminar EcoCore SAS' }));

    await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());
    const options = mockConfirmDelete.mock.calls[0][0];
    expect(options.html).toContain('2 sedes');
    expect(options.html).toContain('40 registros de actividad');
    expect(mockService.deleteCompany).not.toHaveBeenCalled();
  });

  it('debería eliminar la empresa cuando el usuario confirma', async () => {
    mockService.getCompanyDeletionImpact.mockResolvedValue({
      headquarters: 0,
      activityRecords: 0,
      analyses: 0,
    });
    mockConfirmDelete.mockResolvedValue(true);
    mockService.deleteCompany.mockResolvedValue(undefined);
    await renderList();

    await userEvent.click(within(getTable()).getByRole('button', { name: 'Eliminar Cámara Verde' }));

    await waitFor(() => expect(mockService.deleteCompany).toHaveBeenCalledWith('c2'));
  });

  it('debería pedir confirmación simple si falla el cálculo del impacto', async () => {
    mockService.getCompanyDeletionImpact.mockRejectedValue(new Error('fail'));
    mockConfirmDelete.mockResolvedValue(false);
    await renderList();

    await userEvent.click(within(getTable()).getByRole('button', { name: 'Eliminar EcoCore SAS' }));

    await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());
    const options = mockConfirmDelete.mock.calls[0][0];
    expect(options.html).toContain('EcoCore SAS');
    expect(options.html).not.toContain('<li>');
  });

  it('debería mostrar un estado de error con opción de reintentar', async () => {
    mockService.getCompanies.mockRejectedValueOnce(new Error('network'));
    render(<CompanyList />);

    const retry = await screen.findByRole('button', { name: /Reintentar/ });
    await userEvent.click(retry);

    await waitFor(() => expect(screen.queryAllByText('EcoCore SAS').length).toBeGreaterThan(0));
  });

  it('debería mostrar los botones de acción sin depender del hover', async () => {
    await renderList();
    const editLink = within(getTable()).getByRole('link', { name: 'Editar EcoCore SAS' });
    expect(editLink.closest('div')?.className).not.toContain('opacity-0');
  });
});
