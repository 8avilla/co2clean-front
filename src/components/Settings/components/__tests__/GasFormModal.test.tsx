import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GasFormModal } from '../GasFormModal';
import type { Gas } from '../../types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const onSave = vi.fn();
const onClose = vi.fn();

const renderModal = (gas?: Gas) =>
  render(<GasFormModal gas={gas} onSave={onSave} onClose={onClose} />);

// Submit via the submit button (avoids getByRole('form') which needs accessible name)
const clickSubmit = () =>
  userEvent.click(screen.getByRole('button', { name: /crear gas|guardar cambios/i }));

const gasFixture: Gas = {
  id: 'g-1',
  chemical_name: 'Dióxido de Carbono',
  formula: 'CO₂',
  gwp: 1,
  calculation_type: 'non_biogenic',
  is_active: true,
};

describe('GasFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── G-15: Apertura del modal ─────────────────────────────────────────────

  describe('G-15 — Apertura del modal', () => {
    it('muestra el título "Nuevo gas" cuando no hay gas', () => {
      renderModal();
      expect(screen.getByText('Nuevo gas')).toBeInTheDocument();
    });

    it('muestra el título "Editar gas" cuando se edita', () => {
      renderModal(gasFixture);
      expect(screen.getByText('Editar gas')).toBeInTheDocument();
    });

    it('los campos están vacíos al abrir un nuevo gas', () => {
      renderModal();
      expect(screen.getByPlaceholderText('Ej: Dióxido de Carbono')).toHaveValue('');
      expect(screen.getByPlaceholderText('Ej: CO₂')).toHaveValue('');
      expect(screen.getByPlaceholderText('Ej: 273')).toHaveValue(null);
    });
  });

  // ── G-16: Submit vacío ───────────────────────────────────────────────────

  describe('G-16 — Submit con todos los campos vacíos', () => {
    it('muestra los tres mensajes de error requeridos', async () => {
      renderModal();
      await clickSubmit();
      await waitFor(() => {
        expect(screen.getByText('El nombre químico es requerido.')).toBeInTheDocument();
        expect(screen.getByText('La fórmula química es requerida.')).toBeInTheDocument();
        expect(screen.getByText('El GWP es requerido.')).toBeInTheDocument();
      });
    });

    it('no llama a onSave cuando hay errores de validación', async () => {
      renderModal();
      await clickSubmit();
      await waitFor(() => expect(screen.getByText('El nombre químico es requerido.')).toBeInTheDocument());
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  // ── G-17: Nombre corto ───────────────────────────────────────────────────

  describe('G-17 — Nombre químico demasiado corto', () => {
    it('muestra error cuando el nombre tiene 1 caracter', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: Dióxido de Carbono'), 'A');
      await clickSubmit();
      await waitFor(() => {
        expect(screen.getByText('El nombre debe tener al menos 2 caracteres.')).toBeInTheDocument();
      });
    });
  });

  // ── G-18: GWP negativo ───────────────────────────────────────────────────

  describe('G-18 — GWP negativo', () => {
    it('muestra error cuando el GWP es negativo', async () => {
      renderModal();
      // userEvent.type("-5" en un input number → value "-5"
      await userEvent.type(screen.getByPlaceholderText('Ej: 273'), '-5');
      await clickSubmit();
      await waitFor(() => {
        expect(screen.getByText('El GWP no puede ser negativo.')).toBeInTheDocument();
      });
    });
  });

  // ── G-19: GWP decimal ───────────────────────────────────────────────────

  describe('G-19 — GWP decimal', () => {
    it('muestra error cuando el GWP tiene decimales', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: 273'), '1.5');
      await clickSubmit();
      await waitFor(() => {
        expect(screen.getByText('El GWP debe ser un número entero.')).toBeInTheDocument();
      });
    });
  });

  // ── G-20: GWP = 0 válido ────────────────────────────────────────────────

  describe('G-20 — GWP igual a 0 es válido', () => {
    it('no muestra error de GWP y llama a onSave', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: Dióxido de Carbono'), 'Monóxido de Carbono');
      await userEvent.type(screen.getByPlaceholderText('Ej: CO₂'), 'CO');
      await userEvent.type(screen.getByPlaceholderText('Ej: 273'), '0');
      await clickSubmit();
      await waitFor(() => {
        expect(screen.queryByText('El GWP no puede ser negativo.')).not.toBeInTheDocument();
        expect(screen.queryByText('El GWP debe ser un número entero.')).not.toBeInTheDocument();
        expect(screen.queryByText('El GWP es requerido.')).not.toBeInTheDocument();
        expect(onSave).toHaveBeenCalled();
      });
    });
  });

  // ── G-21: Botones de subíndice ──────────────────────────────────────────

  describe('G-21 — Botones de subíndice', () => {
    it('agrega el subíndice ₂ al campo fórmula', async () => {
      renderModal();
      await userEvent.click(screen.getByRole('button', { name: '₂' }));
      expect(screen.getByPlaceholderText('Ej: CO₂')).toHaveValue('₂');
    });

    it('acumula texto + subíndice en la fórmula', async () => {
      renderModal();
      const formulaInput = screen.getByPlaceholderText('Ej: CO₂');
      await userEvent.type(formulaInput, 'H');
      await userEvent.click(screen.getByRole('button', { name: '₂' }));
      await userEvent.type(formulaInput, 'O');
      expect(formulaInput).toHaveValue('H₂O');
    });
  });

  // ── G-23: Errores se limpian al escribir ───────────────────────────────

  describe('G-23 — Errores se limpian al editar el campo', () => {
    it('elimina el error de nombre al empezar a escribir', async () => {
      renderModal();
      await clickSubmit();
      await waitFor(() => {
        expect(screen.getByText('El nombre químico es requerido.')).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText('Ej: Dióxido de Carbono'), 'Me');
      await waitFor(() => {
        expect(screen.queryByText('El nombre químico es requerido.')).not.toBeInTheDocument();
      });
    });

    it('elimina el error de GWP al escribir un valor', async () => {
      renderModal();
      await clickSubmit();
      await waitFor(() => {
        expect(screen.getByText('El GWP es requerido.')).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText('Ej: 273'), '2');
      await waitFor(() => {
        expect(screen.queryByText('El GWP es requerido.')).not.toBeInTheDocument();
      });
    });
  });

  // ── G-24: Flujo feliz al crear ──────────────────────────────────────────

  describe('G-24 — Flujo feliz: crear gas', () => {
    it('llama a onSave con los datos correctos', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: Dióxido de Carbono'), 'Metano');
      await userEvent.type(screen.getByPlaceholderText('Ej: CO₂'), 'CH4');
      await userEvent.type(screen.getByPlaceholderText('Ej: 273'), '28');
      await clickSubmit();
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            chemical_name: 'Metano',
            formula: 'CH4',
            gwp: 28,
            calculation_type: 'non_biogenic',
            is_active: true,
          })
        );
      });
    });
  });

  // ── G-27: Pre-poblar datos al editar ────────────────────────────────────

  describe('G-27 — Editar gas: campos pre-poblados', () => {
    it('pre-puebla el nombre químico', () => {
      renderModal(gasFixture);
      expect(screen.getByPlaceholderText('Ej: Dióxido de Carbono')).toHaveValue('Dióxido de Carbono');
    });

    it('pre-puebla la fórmula', () => {
      renderModal(gasFixture);
      expect(screen.getByPlaceholderText('Ej: CO₂')).toHaveValue('CO₂');
    });

    it('pre-puebla el GWP', () => {
      renderModal(gasFixture);
      expect(screen.getByPlaceholderText('Ej: 273')).toHaveValue(1);
    });

    it('muestra la fórmula del gas en el badge del header', () => {
      renderModal(gasFixture);
      // El header tiene el badge con la fórmula; puede haber más elementos con CO₂
      const badges = screen.getAllByText('CO₂');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  // ── G-30: Cancelar no llama onSave ──────────────────────────────────────

  describe('G-30 — Cancelar no guarda cambios', () => {
    it('llama a onClose al hacer click en Cancelar', async () => {
      renderModal();
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSave).not.toHaveBeenCalled();
    });

    it('no llama a onSave al cancelar aunque los campos estén rellenos', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: Dióxido de Carbono'), 'Metano');
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
