import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CarbonFootprintEditForm } from '../CarbonFootprintEditForm';
import { CarbonFootprintService } from '../../services/carbonFootprint.service';
import type { ApiCarbonFootprint } from '../../types';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../services/carbonFootprint.service', () => ({
  CarbonFootprintService: { getCarbonFootprints: vi.fn(), updateCarbonFootprint: vi.fn() },
}));
vi.mock('../../services/catalogs.service', () => ({
  EmissionGroupsService: { getAll: vi.fn().mockResolvedValue([]) },
  EmissionSourcesService: { getAll: vi.fn().mockResolvedValue([]) },
  EmissionSubsourcesService: { getAll: vi.fn().mockResolvedValue([]), getSourceUnits: vi.fn().mockResolvedValue([]) },
  EmissionUnitsService: { getAll: vi.fn().mockResolvedValue([]) },
}));

const mockService = vi.mocked(CarbonFootprintService);

const record = {
  id: 'r1',
  year: 2024,
  item: 'Papel',
  quantity: 10,
  headquarterId: 'h1',
  loadMode: 'Annual',
} as unknown as ApiCarbonFootprint;

describe('CarbonFootprintEditForm (carga del registro)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.setItem('user', JSON.stringify({ id: 'u1', company: { id: 'co1', name: 'EcoCore' } }));
  });

  it('debería usar el registro guardado por la lista sin volver a pedirlo', async () => {
    sessionStorage.setItem('cf-edit-r1', JSON.stringify(record));
    render(<CarbonFootprintEditForm recordId="r1" />);
    expect(await screen.findByText('Editar registro de emisión')).toBeInTheDocument();
    expect(mockService.getCarbonFootprints).not.toHaveBeenCalled();
  });

  it('debería buscar el registro en la lista de la empresa si no hay caché', async () => {
    mockService.getCarbonFootprints.mockResolvedValue([record]);
    render(<CarbonFootprintEditForm recordId="r1" />);
    expect(await screen.findByText('Editar registro de emisión')).toBeInTheDocument();
    expect(mockService.getCarbonFootprints).toHaveBeenCalledWith({ companyId: 'co1', limit: 500 });
  });

  it('debería mostrar "Registro no encontrado" en lugar de redirigir', async () => {
    mockService.getCarbonFootprints.mockResolvedValue([]);
    render(<CarbonFootprintEditForm recordId="r1" />);
    expect(await screen.findByText('Registro no encontrado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a los registros' })).toHaveAttribute('href', '/huella-carbono');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('debería mostrar un error con reintento cuando falla la carga y recuperarse', async () => {
    mockService.getCarbonFootprints.mockRejectedValueOnce(new Error('network')).mockResolvedValue([record]);
    render(<CarbonFootprintEditForm recordId="r1" />);

    expect(await screen.findByText('No pudimos cargar el registro')).toBeInTheDocument();
    expect(screen.queryByText('Registro no encontrado')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    await waitFor(() => expect(screen.getByText('Editar registro de emisión')).toBeInTheDocument());
  });

  it('debería tratar la ausencia de empresa activa como un error recuperable', async () => {
    localStorage.clear();
    render(<CarbonFootprintEditForm recordId="r1" />);
    expect(await screen.findByText('No pudimos cargar el registro')).toBeInTheDocument();
  });
});
