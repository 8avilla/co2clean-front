# Guía de Diseño de Interfaz (UI/UX) - Portal Salud

Este documento define los lineamientos de diseño visual, experiencia de usuario (UX) e interfaz de usuario (UI), derivados de las convenciones extraídas del módulo `ReferenciaAmbulatoria`. Este enfoque modular busca garantizar la consistencia en el aspecto visual a lo largo de todos los componentes nuevos de la aplicación.

## 1. Design Tokens (Paleta y Tipografía)

### 1.1 Colores Principales
- **Primary (Turquesa Principal):** `#00a9a3` — Usado en bordes, fondos destacados y acentos.
- **Primary Light (Fondo de Cabeceras):** `rgba(0, 169, 163, 0.1)` — Usado para crear contraste sutil en encabezados.
- **Header Text (Textos de Cabecera):** `rgb(0, 169, 163)` — Usado para títulos dentro de cabeceras estructuradas o modulares e íconos temáticos.
- **Border Light:** `rgba(0, 169, 163, 0.2)` — Líneas de separación suaves combinadas con el fondo claro primario.
- **Text (Cuerpo del texto principal):** `#212529` — Letra de lectura normal para descripciones y labels.

### 1.2 Espaciado (Spacing)
El sistema espaciado es consistente usando la escala de múltiplos definidos en los tokens:
- **xs:** `4px`
- **sm:** `8px`
- **md:** `12px`
- **lg:** `16px`
- **xl:** `20px`
- **xxl:** `24px`

### 1.3 Radios de Borde (Border Radius)
La aplicación prioriza esquinas redondeadas amigables e interfaces suaves:
- **sm:** `4px`
- **md:** `8px`
- **lg:** `12px` (Especialmente usado para contenedores/Cards y Paneles)
- **pill:** `20px` o al 50% (Especialmente usado para botones)

### 1.4 Tipografía
- **Font Sizes:**
  - Extra Pequeño (xs): `10px` (Anotaciones en botones o badges secundarios).
  - Pequeño (sm): `12px` (Labels de formulario y textos descriptivos).
  - Medio (md): `14px` (Textos de párrafos o listas básicas).
  - Grande (lg): `18px` / `15px` (Títulos de componentes).
  - Extra Grande (xl): `20px`.
- **Pesos Tipográficos:**
  - **Normal:** `400`
  - **Medium:** `500`
  - **Semibold:** `600`
  - **Bold:** `700`

---

## 2. Componentes UI Base

### 2.1 Tarjetas (Cards) y Paneles Estructurados
Las "Cards" sirven como contenedor base para dividir la información, como las referencias o paneles de comunicación.

- **Contenedor:**
  - **Borde y Esquinas:** Sin borde sólido (`none`), utilizando `borderRadius` de `12px`.
  - **Sombra (Shadow):** Elevación consistente en todo el sistema: `0 4px 12px rgba(0, 51, 102, 0.08)`.
  - **Fondo:** `#ffffff`
  - **Margen inferior:** `20px` para separar tarjetas adyacentes.

- **Cabecera (Header) de la Tarjeta:**
  - **Fondo:** `rgba(0, 169, 163, 0.1)`
  - **Borde inferior:** `1px solid rgba(0, 169, 163, 0.2)`
  - **Padding:** Compacto `12px 20px`.
  - **Disposición:** Flexbox, alineado al centro.
  - **Tipografía (Título):** `15px`, `Bold` (`700`), Color `rgb(0, 169, 163)`.
  - **Iconos:** Tamaño `18px`, con el mismo color `rgb(0, 169, 163)` que el título.

- **Cuerpo (Body) de la Tarjeta:**
  - **Padding:** `16px` uniforme.
  - **Fondo:** Blanco plano sin sombra.

### 2.2 Botones
Los botones prioritarios siguen la convención de estilo en forma de píldora con sombra coloreada.

- **Anatomía Base de Botones:**
  - **Forma:** Redondeados en los extremos (`borderRadius: 20px`).
  - **Tamaño:** Altura de `32px` con `padding: 0 16px`.
  - **Tipografía:** Pequeña (`10px` o base a convenir) con peso `Bold` (`700`).
  - **Fondo Principal:** Generalmente blanco sólido `#ffffff` en estilos ghost, salvo que requieran atención.

- **Botón Primario (Primary):**
  - **Bordes:** `#00a9a3`
  - **Sombra:** Suave basada en el color principal (`0 2px 8px rgba(74, 165, 123, 0.15)`).
  - **Color Texto:** (Token `buttonPrimaryText` / Turquesa principal).

- **Botón de Éxito (Success):**
  - **Sombra:** Verde tenue (`0 2px 8px rgba(82, 196, 26, 0.15)`).
  - **Borde/Texto:** `#00a9a3`.

- **Botón de Peligro / Secundario (Danger):**
  - **Bordes:** `#ff4d4f`.
  - **Sombra:** Rojiza tenue (`0 2px 8px rgba(255, 77, 79, 0.15)`).

### 2.3 Formularios
- **Etiquetas (Labels):**
  - Mostradas en bloque encima del campo (`display: block`).
  - **Margen inferior:** `4px`.
  - **Color:** `#212529`.
  - **Tamaño y Peso:** `12px`, Normal (`400`).

---

## 3. Consideraciones de Experiencia de Usuario (UX)

- **Aislamiento de la Información (Chunking):** 
  Utilizar componentes "Card" para compartimentar la información (ej. Paneles de Chat, Historial Eventos, Resumen). Las vistas con mucha data siempre agrupan campos bajo un sub-título de "Card".
  
- **Jerarquía Visual:** 
  Utilizar el fondo `Primary Light` para señalar el inicio de un bloque nuevo de información que requiere lectura individual.

- **Acciones y Retroalimentación:**
  Los botones estandarizados cuentan con sombras que los elevan del fondo para indicar interactividad. Al usar el componente Card, los botones de acción (`Ghost buttons`) o menús desplegables se ubican a la derecha superior (alineados horizontalmente con el título del Card).
