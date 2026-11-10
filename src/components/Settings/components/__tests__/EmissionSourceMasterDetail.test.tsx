import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmissionSourceMasterDetail } from '../EmissionSourceMasterDetail';
import { EmissionSourceCategoryService } from '@/shared/services/emission-source-category.service';
import { EmissionSourceService, EmissionFactorService } from '@/shared/services/emission-source.service';
import { DeletionImpactService } from '@/shared/services/deletion-impact.service';
import { confirmDelete } from '@/shared/lib/confirm-dialog';
import type { EmissionFactor, EmissionSource, EmissionSourceCategory } from '../../types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/lib/confirm-dialog', () => ({ confirmDelete: vi.fn() }));
vi.mock('@/shared/services/deletion-impact.service', () => ({
  DeletionImpactService: { forEmissionSource: vi.fn() },
}));
vi.mock('@/shared/services/emission-source-category.service', () => ({
  EmissionSourceCategoryService: { getCategories: vi.fn() },
}));
vi.mock('@/shared/services/emission-source.service', () => ({
  EmissionSourceService: { getSources: vi.fn(), deleteSource: vi.fn(), createSource: vi.fn() },
  EmissionFactorService: { getFactors: vi.fn() },
}));
vi.mock('../EmissionSourceFormModal', () => ({
  EmissionSourceFormModal: ({
    onDuplicate,
    onManageCommercialUnits,
  }: {
    onDuplicate?: () => void;
    onManageCommercialUnits?: () => void;
  }) => (
    <div>
      Modal de fuente
      {onManageCommercialUnits && <button onClick={onManageCommercialUnits}>Unidades comerciales</button>}
      {onDuplicate && <button onClick={onDuplicate}>Duplicar</button>}
    </div>
  ),
}));
vi.mock('../CommercialUnitsDrawer', () => ({ CommercialUnitsDrawer: () => <div>Drawer de unidades</div> }));

const mockCategories = vi.mocked(EmissionSourceCategoryService);
const mockSources = vi.mocked(EmissionSourceService);
const mockFactors = vi.mocked(EmissionFactorService);
const mockImpact = vi.mocked(DeletionImpactService);
const mockConfirmDelete = vi.mocked(confirmDelete);

const categories: EmissionSourceCategory[] = [
  { id: 'c1', code: 'EST', name: 'Combustión Estacionaria', description: '', emission_group_id: 'g1', is_active: true },
  { id: 'c2', code: 'MOV', name: 'Combustión Móvil', description: '', emission_group_id: 'g1', is_active: true },
];

const sources: EmissionSource[] = [
  { id: 's1', code: 'GAS', name: 'Gas natural', category_id: 'c1', measurement_type: 'x', is_active: true },
  { id: 's2', code: 'DSL', name: 'Diésel', category_id: 'c2', measurement_type: 'x', is_active: true },
  { id: 's3', code: 'GSL', name: 'Gasolina', category_id: 'c2', measurement_type: 'x', is_active: false },
];

const factors = [
  { id: 'f1', emission_source_id: 's1', gas_id: 'g', gwp: 13900, factor: 0.00002, emission_unit_id: 'u', emission_source_category_id: 'c1' },
  { id: 'f2', emission_source_id: 's1', gas_id: 'g', gwp: 1, factor: 1, emission_unit_id: 'u', emission_source_category_id: 'c1' },
  { id: 'f3', emission_source_id: 's2', gas_id: 'g', gwp: 1, factor: 1, emission_unit_id: 'u', emission_source_category_id: 'c2' },
] as EmissionFactor[];

const getTable = () => screen.getByRole('table');
const getBodyRows = () =>
  within(getTable())
    .getAllByRole('row')
    .slice(1)
    .filter(row => within(row).queryAllByRole('cell').length > 2);

// Source cells also show code and type, so match by the known source names
const getSourceOrder = () =>
  getBodyRows().map(row => sources.find(source => row.textContent?.includes(source.name))?.name);

const renderComponent = async () => {
  render(<EmissionSourceMasterDetail />);
  await waitFor(() => expect(screen.getByText('Gas natural')).toBeInTheDocument());
};

describe('EmissionSourceMasterDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCategories.getCategories.mockResolvedValue(categories);
    mockSources.getSources.mockResolvedValue(sources);
    mockFactors.getFactors.mockResolvedValue(factors);
    mockImpact.forEmissionSource.mockResolvedValue({ factors: 0, commercialUnits: 0 });
  });

  it('debería agrupar por tipo de fuente y luego por nombre por defecto', async () => {
    await renderComponent();
    expect(getSourceOrder()).toEqual(['Gas natural', 'Diésel', 'Gasolina']);
  });

  it('debería ordenar por número de factores al pulsar la cabecera', async () => {
    await renderComponent();
    const header = within(getTable()).getByRole('columnheader', { name: /Factores/ });
    await userEvent.click(within(header).getByRole('button'));
    await userEvent.click(within(header).getByRole('button'));
    expect(getSourceOrder()[0]).toBe('Gas natural');
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('debería buscar por tipo de fuente sin importar tildes', async () => {
    await renderComponent();
    await userEvent.type(screen.getByPlaceholderText(/Buscar tipo de fuente o fuente/), 'combustion movil');
    await waitFor(() => expect(screen.queryByText('Gas natural')).not.toBeInTheDocument());
    expect(screen.getByText('Diésel')).toBeInTheDocument();
  });

  it('debería mostrar las acciones sin depender del hover', async () => {
    await renderComponent();
    const button = within(getTable()).getByRole('button', { name: 'Editar Gas natural' });
    expect(button.closest('div')?.className).not.toContain('opacity-0');
  });

  it('debería advertir de los factores y unidades comerciales antes de eliminar', async () => {
    mockImpact.forEmissionSource.mockResolvedValue({ factors: 2, commercialUnits: 3 });
    mockConfirmDelete.mockResolvedValue(false);
    await renderComponent();

    await userEvent.click(within(getTable()).getByRole('button', { name: 'Eliminar Gas natural' }));

    await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());
    const html = mockConfirmDelete.mock.calls[0][0].html ?? '';
    expect(html).toContain('2 factores de emisión');
    expect(html).toContain('3 unidades comerciales');
    expect(mockSources.deleteSource).not.toHaveBeenCalled();
  });

  it('debería eliminar la fuente cuando el usuario confirma', async () => {
    mockConfirmDelete.mockResolvedValue(true);
    mockSources.deleteSource.mockResolvedValue(undefined);
    await renderComponent();

    await userEvent.click(within(getTable()).getByRole('button', { name: 'Eliminar Diésel' }));

    await waitFor(() => expect(mockSources.deleteSource).toHaveBeenCalledWith('s2'));
    await waitFor(() => expect(screen.queryByText('Diésel')).not.toBeInTheDocument());
  });

  it('debería pedir confirmación simple si falla el cálculo del impacto', async () => {
    mockImpact.forEmissionSource.mockRejectedValue(new Error('fail'));
    mockConfirmDelete.mockResolvedValue(false);
    await renderComponent();

    await userEvent.click(within(getTable()).getByRole('button', { name: 'Eliminar Diésel' }));

    await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());
    expect(mockConfirmDelete.mock.calls[0][0].html).toContain('Diésel');
  });

  it('debería ofrecer duplicar y unidades comerciales solo dentro de la edición', async () => {
    await renderComponent();
    const table = within(getTable());
    expect(table.queryByRole('button', { name: /Duplicar/ })).not.toBeInTheDocument();
    expect(table.queryByRole('button', { name: /unidades comerciales/i })).not.toBeInTheDocument();

    await userEvent.click(table.getByRole('button', { name: 'Editar Gas natural' }));
    expect(screen.getByRole('button', { name: 'Duplicar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unidades comerciales' })).toBeInTheDocument();
  });

  it('debería abrir el drawer de unidades comerciales desde la edición', async () => {
    await renderComponent();
    await userEvent.click(within(getTable()).getByRole('button', { name: 'Editar Gas natural' }));
    await userEvent.click(screen.getByRole('button', { name: 'Unidades comerciales' }));
    expect(screen.getByText('Drawer de unidades')).toBeInTheDocument();
  });

  it('debería duplicar la fuente desde la edición y cerrar el modal', async () => {
    mockSources.createSource.mockResolvedValue({ id: 's9', name: 'Copia de Gas natural' } as never);
    await renderComponent();
    await userEvent.click(within(getTable()).getByRole('button', { name: 'Editar Gas natural' }));
    await userEvent.click(screen.getByRole('button', { name: 'Duplicar' }));

    await waitFor(() =>
      expect(mockSources.createSource).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Copia de Gas natural' }),
      ),
    );
    expect(screen.queryByText('Modal de fuente')).not.toBeInTheDocument();
  });

  it('debería marcar las fuentes inactivas con una insignia', async () => {
    await renderComponent();
    const rows = getBodyRows();
    const gasolina = rows.find(row => row.textContent?.includes('Gasolina'))!;
    const gasNatural = rows.find(row => row.textContent?.includes('Gas natural'))!;
    expect(within(gasolina).getByText('Inactiva')).toBeInTheDocument();
    expect(within(gasNatural).queryByText('Inactiva')).not.toBeInTheDocument();
  });

  it('debería filtrar por estado de la fuente', async () => {
    await renderComponent();
    const select = screen.getByLabelText('Estado de la fuente');
    expect(within(select).getByRole('option', { name: 'Inactivas (1)' })).toBeInTheDocument();

    await userEvent.selectOptions(select, 'inactive');
    await waitFor(() => expect(getSourceOrder()).toEqual(['Gasolina']));

    await userEvent.selectOptions(select, 'active');
    await waitFor(() => expect(getSourceOrder()).toEqual(['Gas natural', 'Diésel']));
  });

  it('debería mostrar los números del detalle en formato es-CO sin redondear factores pequeños', async () => {
    await renderComponent();
    await userEvent.click(screen.getByRole('button', { name: 'Ver factores de Gas natural' }));
    expect(screen.getAllByText('0,00002').length).toBeGreaterThan(0);
    expect(screen.getAllByText('13.900').length).toBeGreaterThan(0);
  });
});
