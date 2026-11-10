import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CarbonFootprintForm } from '../CarbonFootprintForm';
import { confirmDialog } from '@/shared/lib/confirm-dialog';

const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/lib/confirm-dialog', () => ({ confirmDialog: vi.fn() }));
vi.mock('../../services/carbonFootprint.service', () => ({
  CarbonFootprintService: { uploadCsv: vi.fn(), uploadFile: vi.fn(), upload: vi.fn() },
}));
vi.mock('../../services/catalogs.service', () => ({
  EmissionGroupsService: { getAll: vi.fn().mockResolvedValue([]) },
  EmissionSourcesService: { getAll: vi.fn().mockResolvedValue([]) },
  EmissionSubsourcesService: { getAll: vi.fn().mockResolvedValue([]), getSourceUnits: vi.fn(), getById: vi.fn() },
  EmissionUnitsService: { getAll: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../../Companies/services/company.service', () => ({
  CompanyService: { getHeadquarters: vi.fn().mockResolvedValue([]) },
}));

const mockConfirm = vi.mocked(confirmDialog);

const renderForm = async () => {
  render(<CarbonFootprintForm />);
  await screen.findByText('Registro de datos de actividades');
};

describe('CarbonFootprintForm (asistente)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify({ id: 'u1', company: { id: 'co1', name: 'EcoCore' } }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería usar el diálogo de la app (no window.confirm) al limpiar el formulario', async () => {
    const nativeConfirm = vi.spyOn(window, 'confirm');
    mockConfirm.mockResolvedValue(false);
    await renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar formulario' }));

    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockConfirm.mock.calls[0][0].title).toBe('¿Limpiar el formulario?');
    expect(nativeConfirm).not.toHaveBeenCalled();
  });

  it('debería salir directamente si no hay datos ingresados', async () => {
    await renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('debería preguntar antes de salir cuando ya hay datos y respetar la respuesta', async () => {
    mockConfirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await renderForm();

    // Changing the report year makes the form dirty
    const previousYear = String(new Date().getFullYear() - 1);
    await userEvent.selectOptions(screen.getByLabelText(/Año de reporte/), previousYear);

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    await waitFor(() => expect(mockConfirm).toHaveBeenCalledTimes(1));
    expect(mockConfirm.mock.calls[0][0].title).toBe('¿Salir sin guardar?');
    expect(mockBack).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });
});
