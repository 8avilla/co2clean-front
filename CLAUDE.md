# CLAUDE.md - Guía de Desarrollo Frontend (Next.js)

> **ARQUITECTURA DEL PROYECTO**: Toda la arquitectura, organización de archivos y carpetas, y patrones de diseño están documentados en [ARCHITECTURE_GUIDE.MD](./ARCHITECTURE_GUIDE.MD). Este archivo DEBE cumplirse estrictamente.


## IDIOMA Y COMUNICACIÓN

### Reglas de Aplicación

- **IDIOMA DE AI**: DEBE responder en **ESPAÑOL**.
- **IDIOMA DE LOS PLANES DE IMPLEMENTACION**: Los planes de implementación deben estar escritos en **ESPAÑOL**.
- **IDIOMA DE LAS TAREAS**: Las tareas deben estar escritas en **ESPAÑOL**.
- **IDIOMA DEL DOCUMENTO**: Este archivo CLAUDE.md está escrito en **ESPAÑOL**.
- **IDIOMA DE CÓDIGO**: Todo el código (variables, funciones, componentes, hooks, comentarios) DEBE escribirse en **INGLÉS**.
- **IDIOMA DE COMMITS**: Los mensajes de commit DEBEN escribirse en **ESPAÑOL**.
- **IDIOMA DE UI**:
  - Textos visibles al usuario (botones, labels, placeholders): **ESPAÑOL**
  - Mensajes de error/éxito (toasts, alerts): **ESPAÑOL**
  - Títulos de páginas y navegación: **ESPAÑOL**
- **IDIOMA DE DOCUMENTACIÓN**:
  - Comentarios en código: **INGLÉS**
  - README y docs: **ESPAÑOL**
  - Logs técnicos: **INGLÉS**
  - Storybook: **ESPAÑOL**

### Ejemplo de Idiomas en Práctica

```typescript
// ✅ CORRECTO - Código en inglés, UI en español, logs en inglés
'use client';

import { useQuery } from '@tanstack/react-query';
import { getVehicleByPlate } from '@/features/vehicles/services';
import { logger } from '@/core/logger';

export const VehicleDetailsPage = ({ plate }: Props) => {
  const { data: vehicle, error, isLoading } = useQuery({
    queryKey: ['vehicle', plate],
    queryFn: async () => {
      const result = await getVehicleByPlate(plate);

      if (result.isFailure) {
        // Log técnico: inglés
        logger.error('Failed to fetch vehicle', {
          plate,
          error: result.error,
        });
        throw result.error;
      }

      return result.value;
    },
  });

  if (error) {
    // Mensaje al usuario: español
    return (
      <ErrorMessage
        title="Error al cargar vehículo"
        message="No pudimos encontrar el vehículo solicitado"
      />
    );
  }

  if (isLoading) {
    return <LoadingSpinner text="Cargando información..." />; // ← Español
  }

  return (
    <div>
      <h1>Detalles del Vehículo</h1> {/* ← Español */}
      <VehicleCard vehicle={vehicle} />
      <Button onClick={handleEdit}>
        Editar información {/* ← Español */}
      </Button>
    </div>
  );
};

// Service layer
export const getVehicleByPlate = async (
  plate: string
): Promise<Result<Vehicle, VehicleError>> => {
  try {
    const { data } = await apiClient.get<ApiResponse<Vehicle>>(
      `/api/vehicles/${plate}`
    );

    const validatedData = VehicleSchema.parse(data.data);
    return success(validatedData);
  } catch (error) {
    // Log técnico: inglés
    logger.error('Vehicle fetch failed', {
      plate,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // Error interno: inglés (se traduce en UI)
      return failure(new VehicleNotFoundError(plate));
    }

    return failure(new VehicleServiceError(plate, { cause: error }));
  }
};

// ❌ INCORRECTO - Mezcla inconsistente
const obtenerVehiculoPorPlaca = async (placa: string) => { // ← Español
  const { data: vehiculo } = await apiClient.get(`/vehiculos/${placa}`);

  if (!vehiculo) {
    toast.error('Vehicle not found'); // ← Inglés para usuario español
  }

  logger.error('No se encontró el vehículo', { placa }); // ← Español en log técnico
  return vehiculo;
};
```

### Mensajes de Commit

```bash
# ✅ CORRECTO - Commit en español
git commit -m "feat(vehicles): agregar validación de placa en formulario de registro"
git commit -m "fix(auth): corregir problema de expiración de sesión"
git commit -m "perf(dashboard): optimizar carga de gráficos con lazy loading"

# ❌ INCORRECTO - Commit en inglés
git commit -m "feat(vehicles): add plate validation in registration form"
git commit -m "fix(auth): fix session expiration issue"
```

### Tabla de Referencia Rápida

| Contexto                  | Idioma     | Ejemplo                                     |
| ------------------------- | ---------- | ------------------------------------------- |
| Nombres de componentes    | 🇬🇧 Inglés  | `VehicleRegistrationForm.tsx`               |
| Nombres de hooks          | 🇬🇧 Inglés  | `useTrafficFineDebts.ts`                    |
| Nombres de variables      | 🇬🇧 Inglés  | `const userProfile = ...`                   |
| Nombres de funciones      | 🇬🇧 Inglés  | `async function getUserById()`              |
| Props de componentes      | 🇬🇧 Inglés  | `interface Props { vehicleId: string }`     |
| Comentarios en código     | 🇬🇧 Inglés  | `// Fetch user data from API`               |
| Mensajes de commit        | 🇪🇸 Español | `feat: agregar validación de email`         |
| Textos de botones         | 🇪🇸 Español | `<Button>Guardar cambios</Button>`          |
| Labels de formularios     | 🇪🇸 Español | `<label>Nombre completo</label>`            |
| Placeholders              | 🇪🇸 Español | `placeholder="Ingresa tu email"`            |
| Mensajes de error (toast) | 🇪🇸 Español | `toast.error('Email inválido')`             |
| Mensajes de éxito         | 🇪🇸 Español | `toast.success('Guardado exitosamente')`    |
| Logs técnicos             | 🇬🇧 Inglés  | `logger.error('API request failed')`        |
| README.md                 | 🇪🇸 Español | `# Guía de Instalación`                     |
| Nombres de archivos       | 🇬🇧 Inglés  | `vehicle-form.tsx`                          |
| Nombres de carpetas       | 🇬🇧 Inglés  | `src/features/vehicles/`                    |
| Rutas (paths)             | 🇬🇧 Inglés  | `/vehicles/:id`                             |
| Query keys                | 🇬🇧 Inglés  | `queryKey: ['vehicles', id]`                |
| Zod schemas               | 🇬🇧 Inglés  | `VehicleSchema.parse(data)`                 |
| Variables de entorno      | 🇬🇧 Inglés  | `NEXT_PUBLIC_API_URL`                       |
| CSS classes               | 🇬🇧 Inglés  | `className="vehicle-card"`                  |
| Storybook stories         | 🇪🇸 Español | `title: 'Componentes/Botón'`                |
| Tests (describe/it)       | 🇪🇸 Español | `describe('debería validar el formulario')` |
| Títulos de páginas        | 🇪🇸 Español | `<title>Registro de Vehículos</title>`      |
| Meta descriptions         | 🇪🇸 Español | `description="Registra tu vehículo"`        |
| Alt text de imágenes      | 🇪🇸 Español | `alt="Logo de la empresa"`                  |

### Anti-Patrones Comunes

```typescript
// ❌ ANTI-PATRÓN 1: Mezclar idiomas en nombres de componentes
const FormularioVehiculo = () => { // ← Español
  return <form>...</form>;
};

// ❌ ANTI-PATRÓN 2: Props en español
interface PropiedadesComponente { // ← Español
  idVehiculo: string;
  nombreUsuario: string;
}

// ❌ ANTI-PATRÓN 3: Hooks en español
const useObtenerVehiculos = () => { // ← Confuso con convención "use"
  return useQuery(['vehiculos'], obtenerVehiculos);
};

// ❌ ANTI-PATRÓN 4: Textos UI en inglés para usuarios hispanohablantes
<Button>Save Changes</Button> // ← Usuario ve inglés

// ❌ ANTI-PATRÓN 5: Logs en español
logger.error('No se pudo conectar con la API'); // ← Dificulta búsqueda en Google

// ❌ ANTI-PATRÓN 6: Commits en inglés
git commit -m "fix: resolve validation bug" // ← Equipo habla español

// ✅ CORRECTO: Separación clara de contextos
interface VehicleFormProps {
  vehicleId: string;
  onSubmit: (data: VehicleData) => void;
}

export const VehicleForm = ({ vehicleId, onSubmit }: VehicleFormProps) => {
  const { data: vehicle, isLoading } = useVehicleById(vehicleId);

  const handleSubmit = async (formData: FormData) => {
    try {
      await onSubmit(formData);
      // Mensaje al usuario: español
      toast.success('Vehículo guardado exitosamente');
    } catch (error) {
      // Log técnico: inglés
      logger.error('Failed to save vehicle', { vehicleId, error });
      // Mensaje al usuario: español
      toast.error('Error al guardar el vehículo');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Cargando información..." />; // ← Español
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="plate">Placa del vehículo</label> {/* ← Español */}
      <input
        id="plate"
        placeholder="Ingresa la placa" // ← Español
      />
      <Button type="submit">
        Guardar cambios {/* ← Español */}
      </Button>
    </form>
  );
};

// Commit: español
// git commit -m "feat(vehicles): agregar formulario de edición de vehículos"
```

### Preguntas Frecuentes

**P: ¿Puedo usar Spanglish en comentarios?**
R: ❌ No. Usa inglés puro en comentarios de código. Spanglish genera confusión.

**P: ¿Qué pasa si una librería externa tiene documentación en español?**
R: Sigue usando nombres en inglés en tu código. La consistencia es más importante.

**P: ¿Los tests deben estar en español o inglés?**
R: Los `describe()` e `it()` pueden estar en español para mejor legibilidad del equipo:

```typescript
describe('VehicleForm', () => {
  describe('cuando se envía el formulario', () => {
    it('debería validar la placa antes de enviar', async () => {
      // Test code in English
      const result = await validatePlate('ABC123');
      expect(result.isValid).toBe(true);
    });

    it('debería mostrar error si la placa es inválida', async () => {
      const result = await validatePlate('INVALID');
      expect(result.error).toBeDefined();
    });
  });
});
```

**P: ¿Qué idioma uso en PRs y code reviews?**
R: 🇪🇸 Español. Son comunicación interna del equipo.

**P: ¿Cómo manejo traducciones (i18n)?**
R: Si necesitas multi-idioma en el futuro:

```typescript
// Código sigue en inglés
const WelcomeMessage = () => {
  const { t } = useTranslation();

  return (
    <h1>{t('welcome.title')}</h1> // ← Keys en inglés
  );
};

// es.json - Traducciones en español
{
  "welcome": {
    "title": "Bienvenido a la plataforma"
  }
}
```

**P: Si contrato un dev que no habla español, ¿qué hago?**
R: El código está en inglés (universal). Solo necesitarás traducir:

- Este CLAUDE.md
- READMEs
- Documentación de negocio
- Textos de UI (si el dev trabaja en componentes)

El código y estructura del proyecto serán 100% comprensibles para cualquier dev internacional.

**P: ¿Cómo manejo strings en componentes reutilizables?**
R: Usa props para textos:

```typescript
// ✅ CORRECTO - Componente flexible
interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  //...
}

export const Button = ({ children, onClick }: ButtonProps) => {
  return <button onClick={onClick}>{children}</button>;
};

// Uso con texto en español
<Button onClick={handleSave}>Guardar cambios</Button>

// ❌ INCORRECTO - Texto hardcodeado
export const SaveButton = () => {
  return <button>Save</button>; // ← Texto en inglés hardcodeado
};
```

## MANEJO DE ERRORES ESLINT / TYPESCRIPT

Dado que el proyecto utiliza una configuración estricta de `eslint-config-react-app` combinada con TypeScript, es mandatorio prevenir dependencias circulares, problemas de tipado ambiguo y warnings que terminen quebrando los pipelines.

### Errores Comunes y Prevención

1. **`any` es Inaceptable (`@typescript-eslint/no-explicit-any`)**
   - **Error**: El uso progresivo de `any` destruye el ecosistema TS.
   - **Solución**: Si los datos provienen de una API externa no tipada, usa `unknown` y valídalos mediante Esquemas (Zod, Supstruct) o haz un _type casting_ asumiendo el riesgo controlado mediante validación estructural posterior. Tipos parciales `Partial<T>` y genéricos `Record<string, unknown>` son tus mejores aliados en vez de `any`.

2. **Dependencias de los Hooks de React (`react-hooks/exhaustive-deps`)**
   - **Error**: Omitir dependencias en un arreglo de dependencias de `useEffect`, `useCallback` o `useMemo`.
   - **Solución**: **SIEMPRE** declara completamente todas las variables reactivas en el array de dependencias. Si esto causa renders infinitos, la solución es envolver el objeto o función en un `useMemo`/`useCallback` superior o extraer la función fuera del componente, **no** silenciar el linter con `// eslint-disable-next-line`.

3. **Asignación `null` vs `undefined`**
   - **Error**: TypeScript no permite asignar `null` a una propiedad opcional (ej: `myProp?: string`) o a un `T | undefined` a menos que se declare explícitamente `string | null | undefined`.
   - **Solución**: Usa **siempre** `undefined` para reiniciar/borrar valores de variables o campos, y no `null`.

4. **Variables sin usar (`@typescript-eslint/no-unused-vars`)**
   - **Error**: Importaciones perdidas y variables declaradas pero jamás leídas que ensucian el código y desperdician memoria de abstracción.
   - **Solución**: Si deliberadamente necesitas desestructurar solo ciertas propiedades en funciones o iteradores, utiliza el prefijo \`_\` (ej. `const _ignorado = ...`). Si el objeto tiene un valor sobrante (`const { fieldToRemove, ...rest } = obj;`), es válido ignorar `fieldToRemove` pero trata de minimizar esta práctica.

**NUNCA**, bajo NINGUNA CIRCUNSTANCIA, envuelvas funciones o bloques completos en un comentario disable `/* eslint-disable */` a menos que la capa de abstracción técnica (ej. Monkeypatch, legacy interop ineludible) lo exija, e incluso allí, debes justificarlo brevemente.

**INSTRUCCIÓN CORE PARA LA IA**:
> Al momento de generar, refactorizar o sugerir código, la IA **DEBE SIEMPRE** tener en cuenta la configuración estricta de `eslint-config-react-app`, las advertencias del IDE (como posibles `any` o dependencias perdidas) y las reglas específicas del archivo `.eslintrc` o `package.json` del proyecto, escribiendo código que pase el linter limpio en el primer intento.

## REGLAS

- **NUNCA** escribas código sin funcionalidad concreta o alineación con objetivos de negocio.
- **NUNCA** implementes lógica sin pruebas unitarias (Vitest); una funcionalidad no está "Terminada" sin pruebas.
- **NUNCA** uses `any`. Todo debe estar estrictamente tipado usando TypeScript.
- **NUNCA** uses `console.log` en producción. Usa una utilidad centralizada `Logger` para observabilidad.
- **NUNCA** menciones AI o Claude en mensajes de commit.
- **SIEMPRE** aplica ESLint + Prettier antes de cada commit vía hooks `pre-commit` (Husky).
- **SIEMPRE** prioriza **Server Components (RSC)**; usa `'use client'` solo cuando sea estrictamente necesario.
- **SIEMPRE** valida respuestas de API con **Zod** en la capa de servicio antes de que lleguen a la UI.

## PROTOCOLO DE CLARIFICACIÓN

Para maximizar eficiencia y evitar mensajes innecesarios de "ping-pong", la IA debe seguir este protocolo:

1. **REGLA DE CONFIANZA**: Si la confianza en los requisitos está por debajo del **90%**, DETENTE y pide clarificación.
2. **CONSULTA ESTRUCTURADA**: Agrupa todas las ambigüedades (flujo de datos, casos extremos, dominios) en una sola respuesta estructurada.
3. **PROPUESTA ACTIVA**: En lugar de preguntar "¿Cómo debo hacer X?", propón: _"Manejaré X como Y para mantener la arquitectura. ¿Confirmas?"_.

## PROTOCOLO DE PLAN DE IMPLEMENTACIÓN

**CRÍTICO**: Para CUALQUIER solicitud de desarrollo (crear componente, agregar funcionalidad, refactorizar, etc.), la IA DEBE seguir este flujo obligatorio:

### Fase 1: Crear Plan (SIEMPRE PRIMERO)

Antes de escribir cualquier línea de código, la IA DEBE:

1. **Analizar la solicitud** y validar que la confianza sea ≥ 90%
2. **Crear un plan de implementación detallado** con la siguiente estructura:

```markdown
## 📋 Plan de Implementación

### Objetivo

[Descripción clara de qué se va a implementar y por qué]

### Archivos a Crear

- [ ] `src/features/[feature]/components/[Name].tsx` - [Descripción]
- [ ] `src/features/[feature]/hooks/use[Name].ts` - [Descripción]
- [ ] `src/features/[feature]/services/[name].service.ts` - [Descripción]
- [ ] `src/features/[feature]/types/[name].types.ts` - [Descripción]
- [ ] `src/app/[route]/page.tsx` - [Descripción]

### Archivos a Modificar

- [ ] `src/features/[feature]/index.ts` - Exportar nuevos componentes
- [ ] `src/app/layout.tsx` - Agregar provider/metadata
- [ ] [Otros archivos existentes]

### Dependencias

- [ ] Instalación de paquetes: `npm install [packages]`
- [ ] Actualización de variables de entorno (.env.local)

### Pasos de Implementación

1. **Crear tipos y esquemas Zod**
   - Definir interfaces TypeScript
   - Esquemas de validación Zod
   - Types para props de componentes

2. **Implementar Service Layer**
   - Funciones de API con manejo de errores
   - Validación de respuestas con Zod
   - Result pattern para errores tipados

3. **Crear Hooks Personalizados**
   - TanStack Query hooks (useQuery/useMutation)
   - Custom hooks para lógica de estado
   - Configuración de caché y revalidación

4. **Implementar Componentes**
   - Server Components (por defecto)
   - Client Components (solo si necesario)
   - Componentes de UI reutilizables

5. **Crear Rutas (App Router)**
   - Pages con metadata
   - Loading states
   - Error boundaries

6. **Tests**
   - Unit tests para services y hooks
   - Integration tests para componentes (RTL)
   - E2E tests para flujos críticos (si aplica)

7. **Optimizaciones**
   - next/image para imágenes
   - Dynamic imports para componentes pesados
   - Suspense boundaries apropiados

8. **Documentación**
   - Comentarios en componentes complejos
   - Actualizar README si necesario

### Tipo de Renderizado

- [ ] Server Component (SSR/SSG)
- [ ] Client Component (CSR)
- [ ] ISR (Revalidación incremental)

### Estimación de Tiempo

⏱️ [X] minutos de desarrollo

### Riesgos Potenciales

- [Listar posibles problemas o consideraciones]

### Validaciones Necesarias

- [ ] ¿Este componente duplica funcionalidad existente?
- [ ] ¿Puede ser Server Component o necesita ser Client?
- [ ] ¿Afecta el bundle size significativamente?
- [ ] ¿Cumple con presupuestos de rendimiento?

---

**¿Apruebas este plan?** Responde "sí" o "aprobado" para continuar con la implementación automática.
```

3. **DETENER** y esperar aprobación del usuario

### Fase 2: Ejecución Automática (DESPUÉS DE APROBACIÓN)

Una vez que el usuario apruebe el plan (con palabras como "sí", "aprobado", "adelante", "procede", "continúa"), la IA DEBE:

1. **Ejecutar TODO automáticamente** sin preguntar permisos adicionales:
   - Instalar dependencias necesarias
   - Crear todos los archivos listados
   - Modificar archivos existentes
   - Crear tests
   - Actualizar documentación

2. **Reportar progreso** mientras ejecuta:

   ```
   ✅ Paso 1/8: Tipos y esquemas Zod creados
   ✅ Paso 2/8: Service layer implementado
   ✅ Paso 3/8: Hooks personalizados creados
   ...
   ```

3. **Resumen final** al completar:

   ```markdown
   ## ✅ Implementación Completada

   ### Archivos Creados

   - ✅ src/features/vehicles/components/VehicleForm.tsx
   - ✅ src/features/vehicles/hooks/useVehicles.ts
   - ✅ src/features/vehicles/services/vehicle.service.ts
   - ✅ src/features/vehicles/types/vehicle.types.ts
   - ✅ src/app/vehicles/page.tsx

   ### Comandos Ejecutados

   - ✅ npm install zod react-hook-form @hookform/resolvers

   ### Próximos Pasos

   1. Revisar componentes generados
   2. Ejecutar tests: `npm test`
   3. Verificar en desarrollo: `npm run dev`
   4. Hacer commit: `git commit -m "feat(vehicles): agregar formulario de registro de vehículos"`
   ```

### Excepciones al Flujo

La IA puede **saltarse** la creación del plan SOLO si:

1. **Pregunta simple de consulta**: "¿Cómo funciona useQuery?"
2. **Explicación de código**: "Explícame este componente"
3. **Corrección menor**: "Cambia el color de este botón"
4. **Review de código**: "¿Está bien implementado esto?"
5. **Debugging**: "¿Por qué este hook no funciona?"

Para TODO lo demás: **Plan primero, ejecución después**.

### Ejemplos de Aplicación

#### ✅ Ejemplo 1: Solicitud Normal

```
Usuario: "Crea un formulario para registrar vehículos con validación"

IA:
[Crea plan detallado con todos los pasos]
"¿Apruebas este plan?"

Usuario: "Sí, adelante"

IA:
✅ Instalando dependencias...
✅ Creando tipos y esquemas Zod...
✅ Implementando service layer...
✅ Creando hooks...
✅ Generando componentes...
[Ejecuta todo automáticamente]
✅ Implementación completada
```

#### ✅ Ejemplo 2: Baja Confianza

```
Usuario: "Agrega un dashboard"

IA:
"Necesito clarificar antes de crear el plan:
1. ¿Qué tipo de datos mostrará el dashboard?
2. ¿Debe ser en tiempo real o estático?
3. ¿Necesitas gráficos? ¿Qué tipo?"

Usuario: "Dashboard de vehículos con gráficos de barras, estático"

IA:
[Crea plan detallado]
"¿Apruebas este plan?"
```

#### ✅ Ejemplo 3: Consulta Simple (Sin Plan)

```
Usuario: "¿Cuál es la diferencia entre Server y Client Component?"

IA:
[Explica directamente sin crear plan]
```

#### ❌ Ejemplo Incorrecto

```
Usuario: "Crea un componente de búsqueda"

IA: ❌ [Empieza a crear archivos directamente sin plan]
     INCORRECTO - DEBE crear plan primero
```

### Palabras Clave de Aprobación

La IA reconoce estas respuestas como aprobación del plan:

- "sí" / "si"
- "aprobado"
- "adelante"
- "procede"
- "continúa"
- "ok"
- "perfecto"
- "dale"
- "hazlo"
- "ejecuta"

### Palabras Clave de Rechazo

Estas respuestas indican que el plan necesita ajustes:

- "no"
- "espera"
- "modifica"
- "cambia"
- "necesito que..."

## CONVENCIONES DE NOMENCLATURA

Todos los nombres deben ser mnemotécnicos y auto-descriptivos.

- **Componentes**: PascalCase (ej., `RegisterVehicleForm.tsx`).
- **Hooks**: camelCase con prefijo `use` (ej., `useTrafficFineDebts.ts`).
- **Variables**: Sustantivos descriptivos. Los booleanos **DEBEN** usar prefijos: `is`, `has`, `should`, `can`.

```typescript
// ✅ CORRECTO
const isPaymentPending = true;
const beneficiaryFullName = `${user.firstName} ${user.lastName}`;

// ❌ INCORRECTO
const pending = true;
const bfn = `${u.fn} ${u.ln}`;
```

## ARQUITECTURA DEL PROYECTO

> **⚠️ OBLIGATORIO**: Toda la arquitectura del proyecto está documentada en [ARCHITECTURE_GUIDE.MD](./ARCHITECTURE_GUIDE.MD).
>
> **Este archivo DEBE cumplirse estrictamente. No hay excepciones.**

Los lineamientos de arquitectura, organización de archivos y carpetas, patrones de diseño, y reglas de implementación están completamente definidos en [ARCHITECTURE_GUIDE.MD](./ARCHITECTURE_GUIDE.MD).

**Antes de escribir cualquier código, consulta [ARCHITECTURE_GUIDE.MD](./ARCHITECTURE_GUIDE.MD).**

## CHECKLIST DE FUNCIONALIDADES

Antes de implementar cualquier funcionalidad, DEBES responder estas preguntas:

- [ ] ¿Resuelve un problema medido del usuario?
- [ ] ¿Están definidas las métricas de éxito?
- [ ] ¿Está en el roadmap aprobado?
- [ ] ¿Se alinea con los objetivos del sprint actual?

**Si alguna respuesta es "No" o "Desconocido", DETENTE y solicita clarificación al Product Owner.**

## CONVENCIONES DE COMMITS

Sigue [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(vehicles): agregar validación de placa en formulario de registro
fix(auth): resolver condición de carrera en refresh de token
perf(dashboard): carga lazy de gráfico de estadísticas de vehículos
test(payments): agregar pruebas de integración para webhook de Stripe
refactor(api): extraer manejo común de errores a middleware
```

**Patrones prohibidos:**

- ❌ "arreglé bug"
- ❌ "actualicé código con IA"
- ❌ "cambios por Claude"
- ❌ "mejoras"

## PLANTILLA DE PULL REQUEST

```markdown
## Descripción

[Descripción clara de qué y por qué]

## Tipo de Cambio

- [ ] Corrección de bug
- [ ] Nueva funcionalidad
- [ ] Cambio que rompe compatibilidad
- [ ] Actualización de documentación

## Checklist

- [ ] Pruebas agregadas/actualizadas (cobertura ≥ 80%)
- [ ] ESLint + Prettier pasados
- [ ] Presupuesto de rendimiento verificado
- [ ] Auditoría de seguridad pasada
- [ ] Documentación actualizada
- [ ] Revisado por al menos 1 peer

## Impacto en Rendimiento

- Tamaño de bundle: +X KB / -X KB
- Puntuación Lighthouse: [antes] → [después]
```
