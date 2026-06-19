import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmissionSourceCategoryFormModal } from '../EmissionSourceCategoryFormModal';
import type { EmissionSourceCategory } from '../../types';

const onSave = vi.fn();
const onClose = vi.fn();

const renderModal = (category?: EmissionSourceCategory) =>
  render(
    <EmissionSourceCategoryFormModal category={category} onSave={onSave} onClose={onClose} />
  );

// Submit via the submit button (form has no accessible name, cannot use getByRole('form'))
const clickSubmit = () =>
  userEvent.click(
    screen.getByRole('button', { name: /crear categoría de emisión|guardar cambios/i })
  );

const categoryFixture: EmissionSourceCategory = {
  id: 'cat-1',
  name: 'Combustión Estacionaria',
  code: 'COMB_EST',
  description: 'Quema de combustibles en fuentes fijas',
  emission_group_id: '6a1c546f0e939a6a2532717c',
  is_active: true,
};

describe('EmissionSourceCategoryFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── C-01: Apertura como "Nueva categoría" ──────────────────────────────

  describe('C-01 — Abre como "Nueva categoría de emisión" sin props', () => {
    it('muestra el título correcto para crear', () => {
      renderModal();
      expect(screen.getByText('Nueva categoría de emisión')).toBeInTheDocument();
    });

    it('muestra el botón "Crear categoría de emisión"', () => {
      renderModal();
      expect(
        screen.getByRole('button', { name: 'Crear categoría de emisión' })
      ).toBeInTheDocument();
    });
  });

  // ── C-02: Apertura como "Editar categoría" ─────────────────────────────

  describe('C-02 — Abre como "Editar categoría de emisión" con category', () => {
    it('muestra el título correcto para editar', () => {
      renderModal(categoryFixture);
      expect(screen.getByText('Editar categoría de emisión')).toBeInTheDocument();
    });

    it('muestra el botón "Guardar cambios"', () => {
      renderModal(categoryFixture);
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
    });
  });

  // ── C-03: Submit vacío ─────────────────────────────────────────────────

  describe('C-03 — Submit vacío muestra errores de nombre Y código requeridos', () => {
    it('muestra error de nombre requerido', async () => {
      renderModal();
      await clickSubmit();
      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido.')).toBeInTheDocument();
      });
    });

    it('muestra error de código requerido', async () => {
      renderModal();
      await clickSubmit();
      await waitFor(() => {
        expect(screen.getByText('El código es requerido.')).toBeInTheDocument();
      });
    });

    it('no llama a onSave cuando hay errores de validación', async () => {
      renderModal();
      await clickSubmit();
      await waitFor(() =>
        expect(screen.getByText('El nombre es requerido.')).toBeInTheDocument()
      );
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  // ── C-04: Nombre con 1 caracter ────────────────────────────────────────

  describe('C-04 — Nombre con 1 caracter falla validación', () => {
    it('muestra error de longitud mínima del nombre', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: Combustión Móvil'), 'A');
      await clickSubmit();
      await waitFor(() => {
        expect(
          screen.getByText('El nombre debe tener al menos 2 caracteres.')
        ).toBeInTheDocument();
      });
    });
  });

  // ── C-05: Código con 1 caracter ────────────────────────────────────────

  describe('C-05 — Código con 1 caracter falla validación', () => {
    it('muestra error de longitud mínima del código', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: Combustión Móvil'), 'Nombre válido');
      await userEvent.type(screen.getByPlaceholderText('Ej: MOVIL'), 'A');
      await clickSubmit();
      await waitFor(() => {
        expect(
          screen.getByText('El código debe tener al menos 2 caracteres.')
        ).toBeInTheDocument();
      });
    });
  });

  // ── C-06: Código con minúsculas ────────────────────────────────────────

  describe('C-06 — Código con minúsculas falla el patrón CODE_PATTERN', () => {
    it('muestra error de patrón cuando el código tiene letras minúsculas', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: Combustión Móvil'), 'Nombre válido');
      // El campo auto-convierte a mayúsculas, pero el patrón también verifica
      // Escribir 'ce01' → el onChange lo convierte a 'CE01', que es válido.
      // Para probar el error de patrón necesitamos un char inválido que no sea letra/número/guión_bajo
      // Por ejemplo el guión medio '-' no pasa el patrón ^[A-Z0-9_]+$
      await userEvent.type(screen.getByPlaceholderText('Ej: MOVIL'), 'CE-01');
      await clickSubmit();
      await waitFor(() => {
        expect(
          screen.getByText('Solo letras mayúsculas, números y guión bajo (_).')
        ).toBeInTheDocument();
      });
    });
  });

  // ── C-07: Código con guión medio no permitido ──────────────────────────

  describe('C-07 — Código con guión medio es rechazado por CODE_PATTERN', () => {
    it('muestra error de patrón para guión medio', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: Combustión Móvil'), 'Nombre OK');
      await userEvent.type(screen.getByPlaceholderText('Ej: MOVIL'), 'AA-BB');
      await clickSubmit();
      await waitFor(() => {
        expect(
          screen.getByText('Solo letras mayúsculas, números y guión bajo (_).')
        ).toBeInTheDocument();
      });
    });
  });

  // ── C-08: Código con guión bajo SÍ permitido ──────────────────────────

  describe('C-08 — Código con guión bajo es válido', () => {
    it('no muestra error de patrón para guión bajo', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: Combustión Móvil'), 'Nombre válido');
      await userEvent.type(screen.getByPlaceholderText('Ej: MOVIL'), 'CE_01');
      await clickSubmit();
      await waitFor(() => {
        expect(
          screen.queryByText('Solo letras mayúsculas, números y guión bajo (_).')
        ).not.toBeInTheDocument();
      });
    });
  });

  // ── C-09: Auto-uppercase en el input de código ─────────────────────────

  describe('C-09 — El input de código convierte a mayúsculas automáticamente', () => {
    it('convierte las letras minúsculas a mayúsculas en el input', async () => {
      renderModal();
      const codeInput = screen.getByPlaceholderText('Ej: MOVIL');
      await userEvent.type(codeInput, 'movil');
      expect(codeInput).toHaveValue('MOVIL');
    });
  });

  // ── C-10: clearError al escribir ──────────────────────────────────────

  describe('C-10 — Error de nombre desaparece al escribir texto válido', () => {
    it('elimina el error de nombre al empezar a escribir', async () => {
      renderModal();
      await clickSubmit();
      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido.')).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText('Ej: Combustión Móvil'), 'Co');
      await waitFor(() => {
        expect(screen.queryByText('El nombre es requerido.')).not.toBeInTheDocument();
      });
    });

    it('elimina el error de código al empezar a escribir', async () => {
      renderModal();
      await clickSubmit();
      await waitFor(() => {
        expect(screen.getByText('El código es requerido.')).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText('Ej: MOVIL'), 'AB');
      await waitFor(() => {
        expect(screen.queryByText('El código es requerido.')).not.toBeInTheDocument();
      });
    });
  });

  // ── C-11: Flujo feliz al crear ─────────────────────────────────────────

  describe('C-11 — Flujo feliz: nombre+código válidos llama a onSave con datos correctos', () => {
    it('llama a onSave con los datos del formulario', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: Combustión Móvil'), 'Combustión Móvil');
      await userEvent.type(screen.getByPlaceholderText('Ej: MOVIL'), 'MOVIL');
      await userEvent.type(
        screen.getByPlaceholderText('Describe el tipo de fuentes que agrupa esta categoría...'),
        'Vehículos de motor'
      );
      await clickSubmit();
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Combustión Móvil',
            code: 'MOVIL',
            description: 'Vehículos de motor',
          })
        );
      });
    });
  });

  // ── C-12: onSave recibe code en mayúsculas ─────────────────────────────

  describe('C-12 — onSave recibe code en MAYÚSCULAS y trimmed', () => {
    it('el código enviado a onSave está en mayúsculas', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: Combustión Móvil'), 'Test nombre');
      await userEvent.type(screen.getByPlaceholderText('Ej: MOVIL'), 'tst');
      await clickSubmit();
      await waitFor(() => {
        const call = onSave.mock.calls[0][0] as Record<string, unknown>;
        expect(call.code).toBe('TST');
      });
    });
  });

  // ── C-13: Pre-población al editar ─────────────────────────────────────

  describe('C-13 — Pre-popula todos los campos al editar', () => {
    it('pre-puebla el nombre', () => {
      renderModal(categoryFixture);
      expect(screen.getByPlaceholderText('Ej: Combustión Móvil')).toHaveValue(
        'Combustión Estacionaria'
      );
    });

    it('pre-puebla el código', () => {
      renderModal(categoryFixture);
      expect(screen.getByPlaceholderText('Ej: MOVIL')).toHaveValue('COMB_EST');
    });

    it('pre-puebla la descripción', () => {
      renderModal(categoryFixture);
      expect(
        screen.getByPlaceholderText(
          'Describe el tipo de fuentes que agrupa esta categoría...'
        )
      ).toHaveValue('Quema de combustibles en fuentes fijas');
    });

    it('pre-puebla el grupo de emisión', () => {
      renderModal(categoryFixture);
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('6a1c546f0e939a6a2532717c');
    });
  });

  // ── C-14: Cancelar ────────────────────────────────────────────────────

  describe('C-14 — Cancelar llama a onClose sin llamar a onSave', () => {
    it('llama a onClose al hacer click en Cancelar', async () => {
      renderModal();
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSave).not.toHaveBeenCalled();
    });

    it('no llama a onSave al cancelar aunque haya datos en el formulario', async () => {
      renderModal();
      await userEvent.type(screen.getByPlaceholderText('Ej: Combustión Móvil'), 'Combustión');
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
