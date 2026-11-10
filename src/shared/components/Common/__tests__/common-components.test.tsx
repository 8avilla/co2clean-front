import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Ruler } from 'lucide-react';
import { PageHeader } from '../PageHeader';
import { SearchInput } from '../SearchInput';
import { DataTable } from '../DataTable';
import { FormCard } from '../FormCard';
import { FormActionsBar } from '../FormActionsBar';
import { formInputClass, FORM_WIDTH } from '../form-styles';
import { SortableHeader } from '../SortableHeader';
import { Pagination, getVisiblePages } from '../Pagination';
import { RowActions } from '../RowActions';
import { EntityLoadState } from '../EntityLoadState';
import { Breadcrumbs } from '../Breadcrumbs';

describe('PageHeader', () => {
  it('debería mostrar título, descripción y acciones', () => {
    render(<PageHeader title="Gases" description="Gestiona los gases" actions={<button>Nuevo</button>} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Gases' })).toBeInTheDocument();
    expect(screen.getByText('Gestiona los gases')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument();
  });

  it('debería omitir la descripción cuando no se envía', () => {
    const { container } = render(<PageHeader title="Gases" />);
    expect(container.querySelector('p')).toBeNull();
  });
});

describe('SearchInput', () => {
  it('debería notificar los cambios escritos por el usuario', async () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} placeholder="Buscar gas" />);
    await userEvent.type(screen.getByPlaceholderText('Buscar gas'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('no debería mostrar el botón de limpiar con el campo vacío', () => {
    render(<SearchInput value="" onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Limpiar búsqueda' })).toBeNull();
  });

  it('debería limpiar la búsqueda al pulsar el botón', async () => {
    const onChange = vi.fn();
    render(<SearchInput value="co2" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    expect(onChange).toHaveBeenCalledWith('');
  });
});

describe('DataTable', () => {
  const baseProps = { emptyTitle: 'Sin unidades', loadingText: 'Cargando unidades...' };

  it('debería mostrar el texto de carga', () => {
    render(<DataTable {...baseProps} isLoading isEmpty={false}><table /></DataTable>);
    expect(screen.getByText('Cargando unidades...')).toBeInTheDocument();
  });

  it('debería mostrar el estado vacío con su descripción', () => {
    render(
      <DataTable {...baseProps} isLoading={false} isEmpty emptyIcon={Ruler} emptyDescription="Crea una unidad">
        <table />
      </DataTable>,
    );
    expect(screen.getByText('Sin unidades')).toBeInTheDocument();
    expect(screen.getByText('Crea una unidad')).toBeInTheDocument();
  });

  it('debería mostrar la acción del estado vacío', () => {
    render(
      <DataTable {...baseProps} isLoading={false} isEmpty emptyAction={<button>Limpiar filtros</button>}>
        <table />
      </DataTable>,
    );
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeInTheDocument();
  });

  it('debería renderizar el contenido cuando hay datos', () => {
    render(<DataTable {...baseProps} isLoading={false} isEmpty={false}><p>Contenido</p></DataTable>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });
});

describe('FormCard', () => {
  it('debería mostrar el título, las acciones y el contenido', () => {
    render(
      <FormCard title="Datos" actions={<button>Editar</button>}>
        <p>Contenido</p>
      </FormCard>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Datos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });
});

describe('FormActionsBar', () => {
  it('debería llamar a onCancel al pulsar Cancelar', async () => {
    const onCancel = vi.fn();
    render(<FormActionsBar onCancel={onCancel} submitLabel="Guardar" />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('debería mostrar el aviso de cambios sin guardar solo cuando hay cambios', () => {
    const { rerender } = render(<FormActionsBar onCancel={vi.fn()} submitLabel="Guardar" />);
    expect(screen.queryByText('Cambios sin guardar')).not.toBeInTheDocument();
    rerender(<FormActionsBar onCancel={vi.fn()} submitLabel="Guardar" isDirty />);
    expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();
  });

  it('debería deshabilitar el envío y mostrar el texto de progreso mientras guarda', () => {
    render(<FormActionsBar onCancel={vi.fn()} submitLabel="Guardar" busyLabel="Guardando..." isSubmitting />);
    expect(screen.getByRole('button', { name: /Guardando/ })).toBeDisabled();
  });

  it('debería deshabilitar el envío cuando se indica', () => {
    render(<FormActionsBar onCancel={vi.fn()} submitLabel="Guardar" isSubmitDisabled />);
    expect(screen.getByRole('button', { name: /Guardar/ })).toBeDisabled();
  });
});

describe('form-styles', () => {
  it('formInputClass debería usar el acento pedido', () => {
    expect(formInputClass('violet')).toContain('focus:border-violet-500');
    expect(formInputClass()).toContain('focus:border-teal-500');
  });

  it('FORM_WIDTH debería limitar el ancho de los formularios', () => {
    expect(FORM_WIDTH.standard).toBe('max-w-4xl');
  });
});

describe('SortableHeader', () => {
  const renderHeader = (activeKey: string, direction: 'asc' | 'desc', onSort = vi.fn()) =>
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader label="Nombre" sortKey="name" activeKey={activeKey} direction={direction} onSort={onSort} />
          </tr>
        </thead>
      </table>,
    );

  it('debería exponer aria-sort según el estado', () => {
    const { unmount } = renderHeader('other', 'asc');
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'none');
    unmount();
    renderHeader('name', 'desc');
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'descending');
  });

  it('debería notificar la columna al pulsarla', async () => {
    const onSort = vi.fn();
    renderHeader('other', 'asc', onSort);
    await userEvent.click(screen.getByRole('button', { name: /Nombre/ }));
    expect(onSort).toHaveBeenCalledWith('name');
  });
});

describe('Pagination', () => {
  it('debería mostrar la página actual y el total', () => {
    render(<Pagination page={2} totalPages={5} totalItems={47} itemsLabel="usuarios" onPageChange={vi.fn()} />);
    expect(screen.getByText(/47 usuarios/)).toBeInTheDocument();
  });

  it('debería deshabilitar anterior en la primera página y siguiente en la última', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} totalItems={30} itemsLabel="x" onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    rerender(<Pagination page={3} totalPages={3} totalItems={30} itemsLabel="x" onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });

  it('debería pedir la página siguiente y la anterior', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={3} totalItems={30} itemsLabel="x" onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await userEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
  });
});

describe('Pagination (páginas numeradas)', () => {
  it('getVisiblePages debería mostrar primera, última y vecinas con huecos', () => {
    expect(getVisiblePages(1, 3)).toEqual([1, 2, 3]);
    expect(getVisiblePages(1, 10)).toEqual([1, 2, 'gap', 10]);
    expect(getVisiblePages(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10]);
    expect(getVisiblePages(10, 10)).toEqual([1, 'gap', 9, 10]);
    expect(getVisiblePages(1, 1)).toEqual([1]);
  });

  it('debería marcar la página actual y permitir saltar a otra', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={3} totalItems={30} itemsLabel="x" onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('button', { name: 'Página 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('debería mostrar "de N totales" solo cuando hay filtros activos', () => {
    const { rerender } = render(
      <Pagination page={1} totalPages={1} totalItems={5} totalUnfiltered={5} itemsLabel="registros" onPageChange={vi.fn()} />,
    );
    expect(screen.queryByText(/totales/)).not.toBeInTheDocument();
    rerender(
      <Pagination page={1} totalPages={1} totalItems={5} totalUnfiltered={40} itemsLabel="registros" onPageChange={vi.fn()} />,
    );
    expect(screen.getByText(/de 40 totales/)).toBeInTheDocument();
  });
});

describe('RowActions', () => {
  it('debería mostrar editar y eliminar con etiquetas accesibles', () => {
    render(<RowActions entityName="Ana" editHref="/usuarios/1" onDelete={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Editar Ana' })).toHaveAttribute('href', '/usuarios/1');
    expect(screen.getByRole('button', { name: 'Eliminar Ana' })).toBeInTheDocument();
  });

  it('debería ocultar las acciones sin permiso', () => {
    render(<RowActions entityName="Ana" editHref="/x" canEdit={false} canDelete={false} onDelete={vi.fn()} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('debería llamar a onDelete', async () => {
    const onDelete = vi.fn();
    render(<RowActions entityName="Ana" onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Ana' }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('debería ejecutar onEditClick al pulsar el enlace de edición', async () => {
    const onEditClick = vi.fn();
    render(<RowActions entityName="Ana" editHref="/x" onEditClick={onEditClick} />);
    await userEvent.click(screen.getByRole('link', { name: 'Editar Ana' }));
    expect(onEditClick).toHaveBeenCalled();
  });

  it('debería usar un botón cuando editar abre un modal (onEdit)', async () => {
    const onEdit = vi.fn();
    render(<RowActions entityName="Metano" onEdit={onEdit} onDelete={vi.fn()} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Editar Metano' }));
    expect(onEdit).toHaveBeenCalled();
  });

  it('no debería depender del hover para ser visible', () => {
    const { container } = render(<RowActions entityName="Ana" editHref="/x" onDelete={vi.fn()} />);
    expect(container.innerHTML).not.toContain('opacity-0');
  });
});

describe('EntityLoadState', () => {
  const baseProps = {
    entityLabel: 'el usuario',
    gender: 'm' as const,
    backHref: '/usuarios',
    backLabel: 'Volver a usuarios',
    icon: Ruler,
    onRetry: vi.fn(),
  };

  it('debería mostrar el indicador de carga', () => {
    render(<EntityLoadState {...baseProps} status="loading" />);
    expect(screen.getByLabelText('Cargando el usuario')).toBeInTheDocument();
  });

  it('debería mostrar "no encontrado" con el género correcto y un enlace para volver', () => {
    render(<EntityLoadState {...baseProps} status="not-found" />);
    expect(screen.getByText('Usuario no encontrado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a usuarios' })).toHaveAttribute('href', '/usuarios');
  });

  it('debería concordar en femenino', () => {
    render(<EntityLoadState {...baseProps} entityLabel="la empresa" gender="f" status="not-found" />);
    expect(screen.getByText('Empresa no encontrada')).toBeInTheDocument();
  });

  it('debería ofrecer reintentar en caso de error', async () => {
    const onRetry = vi.fn();
    render(<EntityLoadState {...baseProps} status="error" onRetry={onRetry} />);
    expect(screen.getByText('No pudimos cargar el usuario')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('PageHeader con icono', () => {
  it('debería mostrar el icono junto al título', () => {
    render(<PageHeader title="Factores" icon={<span data-testid="icono" />} />);
    expect(screen.getByTestId('icono')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Factores' })).toBeInTheDocument();
  });
});

describe('Breadcrumbs', () => {
  const items = [
    { label: 'Configuración' },
    { label: 'Fuentes y factores', href: '/configuracion/fuentes-emision' },
    { label: 'Editar fuente' },
  ];

  it('debería exponerse como navegación con nombre accesible', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('navigation', { name: 'Ruta de navegación' })).toBeInTheDocument();
  });

  it('debería enlazar los niveles intermedios con href y dejar el resto como texto', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('link', { name: 'Fuentes y factores' })).toHaveAttribute('href', '/configuracion/fuentes-emision');
    expect(screen.queryByRole('link', { name: 'Configuración' })).not.toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('debería marcar el último elemento como página actual y sin enlace', () => {
    render(<Breadcrumbs items={[{ label: 'Empresas', href: '/empresas' }, { label: 'EcoCore', href: '/empresas/1' }]} />);
    const current = screen.getByText('EcoCore');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'EcoCore' })).not.toBeInTheDocument();
  });

  it('debería aceptar una clase para alinear el ancho con el contenido', () => {
    render(<Breadcrumbs items={items} className="max-w-4xl mx-auto" />);
    expect(screen.getByRole('navigation')).toHaveClass('max-w-4xl');
  });
});
