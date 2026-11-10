import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CarbonFootprintRegistrationList } from '../CarbonFootprintList';
import { CarbonFootprintService } from '../../services/carbonFootprint.service';
import { EmissionSubsourcesService } from '../../services/catalogs.service';
import { CompanyService } from '../../../Companies/services/company.service';
import { confirmDelete } from '@/shared/lib/confirm-dialog';
import type { ApiCarbonFootprint } from '../../types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/hooks/usePermission', () => ({
  usePermission: () => ({ hasPermission: () => true }),
}));
vi.mock('@/shared/lib/confirm-dialog', () => ({ confirmDelete: vi.fn() }));
vi.mock('../../services/carbonFootprint.service', () => ({
  CarbonFootprintService: { fetchAll: vi.fn(), deleteCarbonFootprint: vi.fn(), deleteByFilters: vi.fn() },
}));
vi.mock('../../services/catalogs.service', () => ({
  EmissionSubsourcesService: { getSourceUnits: vi.fn() },
}));
vi.mock('../../../Companies/services/company.service', () => ({
  CompanyService: { getHeadquarters: vi.fn() },
}));

const mockRecords = vi.mocked(CarbonFootprintService);
const mockConfirm = vi.mocked(confirmDelete);

const record = (overrides: Record<string, unknown>): ApiCarbonFootprint =>
  ({
    id: 'r1',
    headquarterId: 'h1',
    year: 2024,
    loadMode: 'Annual',
    quantity: 10,
    item: 'Papel',
    emissionGroup: { id: 'g1', name: 'Alcance 1 — Directas' },
    emissionGroupId: 'g1',
    emissionSourceCategory: { id: 'c1', name: 'Combustión Móvil' },
    emissionSourceCategoryId: 'c1',
    emissionSource: { id: 's1', name: 'Diésel' },
    emissionSubsourceId: 's1',
    ...overrides,
  }) as unknown as ApiCarbonFootprint;

const records = [
  record({ id: 'r1', year: 2023, item: 'Papel' }),
  record({ id: 'r2', year: 2025, item: 'Resmas', headquarterId: 'h2' }),
  record({ id: 'r3', year: 2024, item: 'Gasolina', emissionSourceCategory: { id: 'c2', name: 'Electricidad' }, emissionSourceCategoryId: 'c2' }),
];

const getTable = () => screen.getByRole('table');
const getRowYears = () =>
  within(getTable()).getAllByRole('row').slice(1).map(row => within(row).getAllByRole('cell')[0].textContent?.slice(0, 4));

const renderList = async () => {
  render(<CarbonFootprintRegistrationList />);
  await waitFor(() => expect(within(getTable()).getByText('Papel')).toBeInTheDocument());
};

describe('CarbonFootprintRegistrationList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify({ id: 'u1', company: { id: 'co1', name: 'EcoCore' } }));
    mockRecords.fetchAll.mockResolvedValue(records);
    vi.mocked(CompanyService.getHeadquarters).mockResolvedValue([
      { id: 'h1', name: 'Sede Norte', companyId: 'co1' },
      { id: 'h2', name: 'Sede Sur', companyId: 'co1' },
    ]);
    vi.mocked(EmissionSubsourcesService.getSourceUnits).mockResolvedValue([]);
  });

  it('debería mostrar los registros más recientes primero', async () => {
    await renderList();
    expect(getRowYears()).toEqual(['2025', '2024', '2023']);
  });

  it('debería ordenar por año ascendente al pulsar la cabecera', async () => {
    await renderList();
    const header = within(getTable()).getByRole('columnheader', { name: /Año/ });
    expect(header).toHaveAttribute('aria-sort', 'descending');
    await userEvent.click(within(header).getByRole('button'));
    expect(getRowYears()).toEqual(['2023', '2024', '2025']);
  });

  it('debería buscar sin importar tildes ni mayúsculas y combinando palabras', async () => {
    await renderList();
    const input = screen.getByPlaceholderText(/Buscar por sede, tipo de fuente/);
    await userEvent.type(input, 'electricidad 2024');
    await waitFor(() => expect(within(getTable()).queryByText('Papel')).not.toBeInTheDocument());
    expect(within(getTable()).getByText('Gasolina')).toBeInTheDocument();
  });

  it('debería filtrar por sede', async () => {
    await renderList();
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }));
    await userEvent.selectOptions(screen.getByLabelText('Sede'), 'Sede Sur');
    await waitFor(() => expect(within(getTable()).queryByText('Papel')).not.toBeInTheDocument());
    expect(within(getTable()).getByText('Resmas')).toBeInTheDocument();
  });

  it('debería paginar con la paginación compartida y mostrar el total sin filtrar', async () => {
    mockRecords.fetchAll.mockResolvedValue(
      Array.from({ length: 23 }, (_, i) => record({ id: `x${i}`, year: 2000 + i, item: i === 0 ? 'Papel' : `Item ${i}` })),
    );
    render(<CarbonFootprintRegistrationList />);
    await waitFor(() => expect(within(getTable()).getAllByRole('row').length).toBe(11));

    expect(within(screen.getByRole('navigation', { name: 'Paginación' })).getByText(/23 registros/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Página 3' }));
    expect(within(getTable()).getAllByRole('row').length).toBe(4);
    expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page');
  });

  it('debería usar el diálogo de la app para eliminar y escapar el HTML', async () => {
    mockRecords.fetchAll.mockResolvedValue([record({ id: 'r1', item: '<img src=x onerror=alert(1)>' })]);
    mockConfirm.mockResolvedValue(false);
    render(<CarbonFootprintRegistrationList />);
    await screen.findByRole('table');
    await userEvent.click(await within(getTable()).findByRole('button', { name: /Eliminar registro de Sede Norte 2024/ }));

    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    const html = mockConfirm.mock.calls[0][0].html ?? '';
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(mockRecords.deleteCarbonFootprint).not.toHaveBeenCalled();
  });

  it('debería eliminar el registro cuando el usuario confirma', async () => {
    mockConfirm.mockResolvedValue(true);
    mockRecords.deleteCarbonFootprint.mockResolvedValue(undefined);
    await renderList();

    await userEvent.click(within(getTable()).getByRole('button', { name: /Eliminar registro de Sede Norte 2023/ }));

    await waitFor(() => expect(mockRecords.deleteCarbonFootprint).toHaveBeenCalledWith('r1'));
  });

  it('debería guardar el registro en sessionStorage al ir a editar', async () => {
    await renderList();
    await userEvent.click(within(getTable()).getByRole('link', { name: /Editar registro de Sede Norte 2023/ }));
    expect(sessionStorage.getItem('cf-edit-r1')).toContain('"id":"r1"');
  });

  it('debería mostrar un estado de error con reintento en lugar de "sin registros"', async () => {
    mockRecords.fetchAll.mockRejectedValueOnce(new Error('network'));
    render(<CarbonFootprintRegistrationList />);
    expect(await screen.findByText('No pudimos cargar los registros')).toBeInTheDocument();
    expect(screen.queryByText('Sin registros de actividades')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    await waitFor(() => expect(within(getTable()).getByText('Papel')).toBeInTheDocument());
  });

  it('debería mostrar las acciones sin depender del hover', async () => {
    await renderList();
    const link = within(getTable()).getByRole('link', { name: /Editar registro de Sede Norte 2023/ });
    expect(link.closest('div')?.className).not.toContain('opacity-0');
  });
});
