import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { buttonClass } from '../button-styles';
import { formInputClass, FORM_LABEL_CLASS } from '../form-styles';

describe('buttonClass', () => {
  it('debería usar siempre el mismo color en el botón primario', () => {
    expect(buttonClass()).toContain('bg-teal-600');
    expect(buttonClass({ size: 'sm' })).toContain('bg-teal-600');
  });

  it('debería usar estilos neutros en las variantes secundaria y ghost', () => {
    expect(buttonClass({ variant: 'secondary' })).toContain('border-zinc-200');
    expect(buttonClass({ variant: 'ghost' })).not.toContain('bg-teal-600');
  });
});

describe('Button', () => {
  it('debería ser type="button" por defecto y disparar onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);
    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toHaveAttribute('type', 'button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Modal', () => {
  it('debería mostrar el título y cerrar con el botón y con Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Nuevo gas" onClose={onClose}>
        <p>Contenido</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Nuevo gas' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('form-styles', () => {
  it('debería exponer una sola clase de label y un input por acento', () => {
    expect(FORM_LABEL_CLASS).toContain('text-xs');
    expect(formInputClass('emerald')).toContain('focus:border-emerald-500');
  });
});
