# Guía de Diseño de Interfaz (UI/UX) - EcoCore

Este documento describe las convenciones visuales y de experiencia de usuario **que ya usa EcoCore** y las que deben seguirse en pantallas nuevas. Está basado en el código actual (Tailwind CSS 4, lucide-react, sonner, sweetalert2).

> Las secciones marcadas con **⚠ Deuda** documentan inconsistencias existentes que aún no se han unificado. No las repliques en código nuevo.

---

## 1. Fundamentos

### 1.1 Tipografía
- Fuente declarada: **Geist Sans** y **Geist Mono** (`src/app/layout.tsx`).
- **⚠ Deuda:** `globals.css` fuerza `font-family: Arial` en `body`, por lo que Geist no se aplica realmente. Decidir una de las dos y eliminar la otra.
- Escala usada habitualmente:

| Uso | Clases |
| --- | --- |
| Título de página (`h1`) | `text-2xl font-bold text-zinc-900` |
| Título de modal / sección (`h2`) | `text-lg font-bold text-zinc-900` o `text-base font-bold` |
| Subtítulo de página | `text-sm text-zinc-500` |
| Label de formulario | `text-xs font-bold text-zinc-500 uppercase tracking-wider` |
| Texto de ayuda / vacío | `text-xs text-zinc-400` |
| Códigos, símbolos, unidades | `font-mono` |

### 1.2 Color
- **Neutros:** escala `zinc` para texto, bordes y fondos. Fondo de la aplicación: `bg-zinc-50`; superficies: `bg-white`.
- **Acento de marca:** `teal` (`teal-600` primario, `teal-700` hover, `teal-50` fondo suave). Se usa en el sidebar, el estado activo de la navegación y el color de confirmación de los diálogos (`#00a9a3`).
- **Semánticos:** rojo para errores y acciones destructivas (`red-500/600`), ámbar para advertencias, esmeralda para éxito.
- **⚠ Deuda — acento por módulo:** hoy cada módulo usa un acento distinto para botones, foco y badges.

| Módulo | Acento actual |
| --- | --- |
| Administración (Empresas, Usuarios, Roles) | `teal` |
| Configuración (Fuentes, Categorías, Gases, Unidades) | `violet` |
| Huella de carbono (registros, factores) | `emerald` |

  Para pantallas nuevas usa **teal**. Unificar los otros módulos es una tarea pendiente.

### 1.3 Radios, bordes y sombras
- Controles (inputs, selects, botones): `rounded-lg`.
- Tarjetas y barras de filtros: `rounded-xl`.
- Contenedores de tabla y modales: `rounded-2xl`.
- Avatares y badges: `rounded-full`.
- Bordes: `border border-zinc-100` (tarjetas) o `border-zinc-200` (controles).
- Sombra: `shadow-sm` en tarjetas; `shadow-xl` solo en modales.

### 1.4 Espaciado
- Separación vertical entre bloques de página: `space-y-4` o `space-y-6`.
- Padding de tarjetas: `p-4`; de modales: `px-6 py-4` en cabecera y pie, `p-6` en el cuerpo.

---

## 2. Componentes compartidos

Ubicados en `src/shared/components/Common/`. **Úsalos en lugar de repetir el marcado.**

| Componente | Uso |
| --- | --- |
| `PageHeader` | Título (`h1`), descripción y acciones de cada página de listado. |
| `SearchInput` | Buscador con icono y botón para limpiar. Acepta `accent` (`violet`, `teal`, `emerald`). |
| `DataTable` | Tarjeta contenedora de tabla con estados de carga y vacío (`emptyAction` para "Limpiar filtros"). |
| `SortableHeader` | Cabecera de tabla ordenable, con `aria-sort`. Se usa con `nextSortState` de `shared/lib/list-utils`. |
| `Pagination` | Paginación cliente con páginas numeradas, "Página X de Y — N elementos" y, con filtros, "de M totales". Acepta `accent`. |
| `RowActions` | Botones editar/eliminar por fila, siempre visibles y con `aria-label`. |
| `FormCard`, `FormActionsBar` | Tarjeta y barra fija de acciones de formulario (ver 3.2). |
| `Breadcrumbs` | Ruta de navegación (`Configuración / Gases (GEI)`). En pantallas de edición el último nivel es el nombre de la entidad. Los niveles sin página propia ("Configuración", "Huella de carbono") van sin enlace. Alinea su ancho con el contenido (`className="max-w-4xl mx-auto"`). |
| `EntityLoadState` | Pantallas de carga, "no encontrado" y error con reintento para páginas de edición. Se usa con `useEntityLoader`. |
| `Skeleton`, `Tooltip` | Estados de carga y ayudas contextuales (`src/shared/components/`). |
| `confirmDialog`, `confirmDelete` | Confirmaciones (`src/shared/lib/confirm-dialog.ts`). No usar `window.confirm`. |

```tsx
<PageHeader
  title="Gases"
  description="Gestiona los gases y sus valores de GWP."
  actions={<button>Nuevo gas</button>}
/>

<SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre..." />

<DataTable
  isLoading={isLoading}
  loadingText="Cargando gases..."
  isEmpty={filtered.length === 0}
  emptyIcon={Flame}
  emptyTitle="Sin resultados"
>
  <table>...</table>
</DataTable>
```

---

## 3. Patrones de pantalla

### 3.1 Listado (patrón base)
1. `PageHeader` con el botón principal de creación a la derecha.
2. Barra de filtros: `SearchInput` + selects + contador de resultados.
3. `DataTable` con la tabla.
4. Acciones por fila con `RowActions`: siempre visibles (nunca solo al pasar el mouse) y con `aria-label` que incluye el nombre de la fila.
5. El nombre de la fila es un enlace a su pantalla de edición (solo si el usuario puede editar).
6. Búsqueda insensible a tildes y mayúsculas (`matchesSearchTerms`), cabeceras ordenables y estado de error con **Reintentar**.
7. **Borrado:** usa `confirmDeleteWithImpact` (`shared/lib`): consulta primero lo que depende del elemento (sedes, usuarios, factores…) y lo muestra en el diálogo. Solo advierte, no bloquea. Si la consulta falla, pide una confirmación simple. **Nunca** uses `window.confirm`. Escapa con `escapeHtml` cualquier texto de usuario que vaya dentro del HTML.
8. **Sesión:** lee el usuario y la empresa activa con `shared/lib/session` (`getStoredUser`, `getActiveCompany`), no parseando `localStorage` a mano.

### 3.2 Formularios de página (crear / editar)
Densidad estándar, definida en `src/shared/components/Common/form-styles.ts`:

| Elemento | Valor |
| --- | --- |
| Ancho máximo, centrado | `FORM_WIDTH.standard` (`max-w-4xl`); `wide` (`max-w-5xl`) para formularios con tablas o asistentes; `narrow` (`max-w-2xl`) para formularios cortos |
| Separación entre tarjetas | `space-y-4` |
| Tarjeta | `FormCard`: cabecera `px-5 py-3`, cuerpo `p-5` |
| Cuadrícula de campos | `FORM_FIELD_GRID`: 3 columnas, `gap-x-4 gap-y-3` |
| Etiqueta | `FORM_LABEL_CLASS` (`text-xs font-bold text-zinc-600`), con `htmlFor` |
| Campo (input / select) | `formInputClass()`: `px-3 py-2 text-sm`, 36 px de alto |
| Separación etiqueta–campo | `space-y-1` |
| Acciones | `FormActionsBar`: barra fija abajo con Cancelar, Guardar y aviso "Cambios sin guardar" |

Reglas:
- **Una sola tarjeta** para datos relacionados; separa subsecciones con un subtítulo pequeño (por ejemplo "Ubicación"), no con otra tarjeta.
- Los campos cortos (NIT, país, año) ocupan 1 columna; los largos (nombre, correo) 2; la descripción y las notas 3.
- Usa `useUnsavedChangesGuard(isDirty)` para avisar al salir con cambios, tanto al cerrar la pestaña como en los botones Volver y Cancelar.
- El encabezado de la página lo pone el formulario; la página no repite el título.
- En pantallas de edición con varias secciones (datos + sedes, perfil + empresas), usa **pestañas** que mantienen ambos paneles montados para no perder cambios sin guardar.

### 3.3 Formulario en modal
- Cabecera compacta (`px-5 py-3`) con título y botón de cerrar (`aria-label="Cerrar"`); cuerpo `p-5 space-y-3`; pie con **Cancelar** (secundario) y la acción principal a la derecha. Se cierra con Escape y se expone como `role="dialog"`.
- Validación en línea: borde rojo + mensaje `text-xs text-red-500 font-medium` bajo el campo; el error desaparece al editar el campo.
- Para formularios con muchas secciones, usa **pestañas** y divide el código en un componente por pestaña (ver `emission-source-form/`).
- Un formulario de más de ~400 líneas debe dividirse en subcomponentes.

### 3.4 Asistente por pasos (wizard)
- Indicador "Paso N de M" con barra de progreso.
- Cada paso muestra un icono de estado (`SectionStatus`) completo/pendiente.
- Botones **Atrás** / **Siguiente**; el último paso confirma la acción.

### 3.5 Estados
- **Carga:** spinner `Loader2` con texto ("Cargando datos...") o `Skeleton`.
- **Vacío:** icono en recuadro gris, título corto, descripción y, si aplica, acción para limpiar filtros o crear el primer elemento.
- **Error de carga:** `toast.error` con mensaje en español.

---

## 4. Navegación y vocabulario

### 4.1 Sidebar
- Grupos: Inicio, Empresas, Usuarios, Roles y Permisos, **Huella de Carbono**, **Configuración**.
- El estado activo usa `bg-teal-50 text-teal-600`.
- Los ítems de Configuración se definen en `src/shared/components/Layout/settings-nav.ts` (orden jerárquico: tipos de fuentes → fuentes y factores → gases → unidades). Para agregar uno, edita esa lista y respeta los permisos.
- Cada ítem se oculta si el usuario no tiene el permiso correspondiente.

### 4.2 Vocabulario
> Los números se muestran con `formatNumber` (`shared/lib/format`): punto de miles y coma decimal, con cifras significativas para no redondear a cero los factores pequeños.

EcoCore trabaja con dos estándares: **GHG Protocol** (Alcance 1/2/3) e **ISO 14064** (Categoría 1–6). Por eso el nivel superior usa un término neutro y "Categoría" **no** se usa para el segundo nivel (en ISO es el nivel superior).

| Nivel | Término en la UI | Ejemplo |
| --- | --- | --- |
| Nivel superior | **Grupo de emisión** (el valor depende del estándar) | Alcance 1 (GHG) / Categoría 1 (ISO 14064) |
| Segundo nivel | **Tipo de fuente** | Combustión estacionaria |
| Tercer nivel | **Fuente de emisión** | Diésel B10 |
| Dato de cálculo | **Factor de emisión** | 2.68 kg CO₂ / L |
| Dato cargado | **Registro de actividad** | |
| Resultado | **Análisis de huella de carbono** | |

Reglas:
- Nunca escribas "Alcance" como nombre de columna, filtro o título genérico: usa "Grupo de emisión". "Alcance N" y "Categoría N" solo aparecen como **valores** del grupo.
- Nunca escribas "Categoría de fuente" ni "Categoría de emisión" para el segundo nivel.
- En el código se mantienen los nombres técnicos (`EmissionSourceCategory`, `category_id`, ruta `/configuracion/categorias-fuentes`); el vocabulario aplica solo a textos visibles.

### 4.3 Configuración
- **Tipos de fuentes** es el único lugar donde se crean y editan los tipos de fuente. Los demás formularios enlazan a esa página.
- **Fuentes y factores** es el único lugar donde se editan los factores de emisión (desde el modal de la fuente). La tabla expandible es de solo lectura.
- Los grupos de emisión se obtienen de la API (`useEmissionGroups`); no se escriben IDs en el código.

---

## 5. Feedback al usuario
- Operaciones exitosas y errores de red: `toast.success` / `toast.error` (sonner, posición superior central), siempre en español.
- Confirmaciones destructivas: `confirmDelete` (sweetalert2) con color de peligro.
- Botones con acción asíncrona: deshabilitar y mostrar `Loader2` mientras se procesa.

---

## 6. Accesibilidad y responsive
- Botones solo con icono: incluir `title` o `aria-label` en español.
- Etiquetar cada campo con `<label>`.
- Contraste mínimo: texto de cuerpo `zinc-700` o más oscuro sobre fondo blanco; `zinc-400` solo para texto secundario no esencial.
- Layouts con `flex-col sm:flex-row` y tablas dentro de `overflow-x-auto`.
- Sidebar: colapsable en escritorio (`w-[72px]`) y deslizable en móvil.

---

## 7. Checklist para pantallas nuevas
- [ ] ¿Usa `PageHeader`, `SearchInput` y `DataTable` en lugar de marcado repetido?
- [ ] Si es un formulario: ¿usa `FormCard`, `FormActionsBar`, el ancho máximo y la densidad de la sección 3.2?
- [ ] ¿Todos los textos visibles están en español y respetan el vocabulario de la sección 4.2?
- [ ] ¿Tiene estados de carga, vacío y error?
- [ ] ¿Valida en línea y usa `confirmDelete` para borrados?
- [ ] ¿Está protegida con `PermissionGuard` y aparece en el sidebar solo con permiso?
- [ ] ¿Usa teal como acento y evita estilos ad hoc?
- [ ] ¿Incluye pruebas unitarias (Vitest)?
