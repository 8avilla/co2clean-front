import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BranchFormModal } from '../BranchFormModal';
import { LocationService } from '@/shared/services/location.service';
import { confirmDialog } from '@/shared/lib/confirm-dialog';

vi.mock('@/shared/lib/confirm-dialog', () => ({ confirmDialog: vi.fn() }));
vi.mock('@/shared/services/location.service', () => ({
  LocationService: { getDepartments: vi.fn(), getMunicipalities: vi.fn() },
}));

const mockLocation = vi.mocked(LocationService);

const companyLocation = { departmentId: 'd1', municipalityId: 'm1', address: 'Carrera 50 # 10 - 20' };

const renderModal = (props: Partial<React.ComponentProps<typeof BranchFormModal>> = {}) =>
  render(
    <BranchFormModal
      isOpen
      onClose={vi.fn()}
      onSubmit={vi.fn()}
      companyLocation={companyLocation}
      {...props}
    />,
  );

describe('BranchFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.getDepartments.mockResolvedValue([{ id: 'd1', name: 'Antioquia' }] as Awaited<
      ReturnType<typeof LocationService.getDepartments>
    >);
    mockLocation.getMunicipalities.mockResolvedValue([{ id: 'm1', name: 'Medellín' }] as Awaited<
      ReturnType<typeof LocationService.getMunicipalities>
    >);
  });

  it('debería ofrecer usar la ubicación de la empresa al crear una sede', async () => {
    renderModal();
    expect(await screen.findByRole('button', { name: /Usar la ubicación de la empresa/ })).toBeInTheDocument();
  });

  it('no debería ofrecer el atajo al editar una sede', () => {
    renderModal({ initialData: { id: 'h1', name: 'Norte', companyId: 'c1' } });
    expect(screen.queryByRole('button', { name: /Usar la ubicación de la empresa/ })).not.toBeInTheDocument();
  });

  it('debería copiar dirección, departamento y municipio de la empresa', async () => {
    renderModal();
    await userEvent.click(await screen.findByRole('button', { name: /Usar la ubicación de la empresa/ }));

    await waitFor(() => {
      expect(screen.getByLabelText('Dirección')).toHaveValue('Carrera 50 # 10 - 20');
      expect(screen.getByLabelText('Municipio')).toHaveValue('m1');
    });
    expect(screen.getByLabelText('Departamento')).toHaveValue('d1');
  });

  it('debería cerrarse con la tecla Escape', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('debería exponerse como diálogo accesible', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: 'Nueva sede' })).toBeInTheDocument();
  });

  describe('cierre con cambios sin guardar', () => {
    it('debería cerrar sin preguntar cuando no hay cambios', async () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      await waitFor(() => expect(onClose).toHaveBeenCalled());
      expect(confirmDialog).not.toHaveBeenCalled();
    });

    it('debería preguntar al cancelar con cambios y respetar la respuesta', async () => {
      vi.mocked(confirmDialog).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      const onClose = vi.fn();
      renderModal({ onClose });
      await userEvent.type(screen.getByLabelText('Nombre de la Sede'), 'Sede Nueva');

      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      await waitFor(() => expect(confirmDialog).toHaveBeenCalledTimes(1));
      expect(onClose).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('debería preguntar también al pulsar Escape con cambios', async () => {
      vi.mocked(confirmDialog).mockResolvedValue(false);
      renderModal();
      await userEvent.type(screen.getByLabelText('Nombre de la Sede'), 'x');
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(confirmDialog).toHaveBeenCalled());
    });

    it('no debería abrir otro diálogo con Escape si ya hay uno abierto', async () => {
      renderModal();
      await userEvent.type(screen.getByLabelText('Nombre de la Sede'), 'x');
      const swal = document.createElement('div');
      swal.className = 'swal2-container';
      document.body.appendChild(swal);
      await userEvent.keyboard('{Escape}');
      swal.remove();
      expect(confirmDialog).not.toHaveBeenCalled();
    });
  });
});
