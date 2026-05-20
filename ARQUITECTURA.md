# Arquitectura Frontend - Portal Salud Coosalud

## Visión General

Arquitectura escalable y mantenible para el Portal de Salud de Coosalud, diseñada para crecer de forma incremental mientras se mantiene la robustez y calidad del código.

---

## Principios Arquitectónicos

### 1. **Separación de Responsabilidades**

- **Componentes**: Solo UI y lógica de presentación
- **Servicios**: Comunicación con APIs y lógica de negocio
- **Types**: Definiciones de tipos compartidos
- **Hooks**: Lógica reutilizable de estado y efectos

### 2. **Composición sobre Herencia**

- Componentes pequeños y reutilizables
- Composición de funcionalidades mediante props y children
- Shared components para elementos comunes

### 3. **Single Source of Truth**

- Estado centralizado donde sea necesario
- Evitar duplicación de datos
- Props drilling controlado con context cuando sea apropiado

### 4. **Escalabilidad Incremental**

- Módulos independientes que pueden crecer
- Nuevas funcionalidades sin afectar código existente
- Refactorización progresiva

---

## Estructura de Directorios

```
src/
├── components/
│   ├── ReferenciaAmbulatoria/          # Módulo de Referencias
│   │   ├── components/                  # Componentes del módulo
│   │   │   ├── shared/                  # Componentes compartidos
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── FormLabel.tsx
│   │   │   │   └── ...
│   │   │   ├── AffiliateSearch.tsx
│   │   │   ├── SupplierSearch.tsx
│   │   │   ├── AttentionInfo.tsx
│   │   │   ├── ServiceSearch.tsx
│   │   │   ├── ContractSearch.tsx
│   │   │   └── SaveReference.tsx
│   │   ├── pages/                       # Páginas del módulo
│   │   │   ├── AmbulatoryCreate.tsx
│   │   │   ├── AmbulatoryList.tsx
│   │   │   └── AmbulatoryDetail.tsx
│   │   ├── services/                    # Servicios API
│   │   │   ├── api.ts                   # Cliente axios configurado
│   │   │   ├── affiliate.service.ts
│   │   │   ├── supplier.service.ts
│   │   │   ├── healthcare-services.service.ts
│   │   │   ├── subcode.service.ts
│   │   │   ├── supplies-and-devices.service.ts
│   │   │   ├── package.service.ts
│   │   │   ├── logistic-support.service.ts
│   │   │   └── ambulatory-reference.service.ts
│   │   ├── hooks/                       # Custom hooks
│   │   │   ├── useDebounce.ts
│   │   │   ├── useAffiliate.ts
│   │   │   └── useServiceSearch.ts
│   │   ├── types/                       # Tipos TypeScript
│   │   │   └── index.ts
│   │   └── utils/                       # Utilidades
│   │       ├── formatters.ts
│   │       └── validators.ts
│   │
│   ├── Autorizaciones/                  # Módulo de Autorizaciones
│   ├── Facturacion/                     # Módulo de Facturación
│   └── ...                              # Otros módulos
│
├── shared/                              # Compartido entre módulos
│   ├── components/                      # Componentes globales
│   │   ├── Layout/
│   │   ├── Navigation/
│   │   └── Common/
│   ├── hooks/                           # Hooks globales
│   ├── services/                        # Servicios globales
│   │   └── auth.service.ts
│   ├── types/                           # Tipos globales
│   └── utils/                           # Utilidades globales
│
├── helpers/
│   └── Config.js                        # Configuración global
│
└── App.tsx

```

---

## Patrones de Diseño Implementados

### 1. **Service Layer Pattern**

Cada módulo tiene su carpeta de servicios que encapsula la comunicación con APIs.

**Beneficios:**

- Separación clara entre UI y lógica de datos
- Fácil testing y mocking
- Reutilización de lógica de API

**Ejemplo:**

```typescript
// services/affiliate.service.ts
export class AffiliateService {
  static async searchAffiliate(params: SearchParams) {
    const response = await api.get("/affiliates", { params });
    return response.data;
  }
}
```

---

### 2. **Composition Pattern**

Componentes grandes divididos en componentes más pequeños y especializados.

**Ejemplo:**

```typescript
// AmbulatoryCreate.tsx (Orquestador)
<>
  <AffiliateSearch onAffiliateFound={handleAffiliateFound} />
  <SupplierSearch onSupplierFound={handleSupplierFound} />
  <AttentionInfo onQuotationChange={setIsQuotationEnabled} />
  <ServiceSearch onServicesChange={handleServicesChange} />
  <ContractSearch onContractConfirm={handleContractConfirm} />
  <SaveReference {...allData} onSaveSuccess={handleSaveSuccess} />
</>
```

---

### 3. **Unified Search Pattern**

Un componente con múltiples tabs que consume diferentes servicios pero mantiene la misma UI.

**Implementación:**

```typescript
const handleSearchByType = (searchTerm, entityName) => {
  switch (entityName) {
    case "Services":
      return HealthcareServicesService.getServices();
    case "Packages":
      return PackageService.searchPackages();
    case "SubCodes":
      return SubCodeService.searchSubCodes();
    // ... más tipos
  }
};
```

**Beneficios:**

- Código DRY (Don't Repeat Yourself)
- Fácil agregar nuevos tipos de búsqueda
- UI consistente

---

### 4. **Shared Components Pattern**

Componentes reutilizables en carpeta `shared/`.

**Ejemplos:**

- `Card` - Contenedor con header y body
- `FormLabel` - Labels consistentes
- `SearchInput` - Input de búsqueda con debounce

---

### 5. **Type Safety Pattern**

Tipos TypeScript centralizados en `types/index.ts`.

**Beneficios:**

- Autocompletado en IDE
- Detección temprana de errores
- Documentación implícita

---

## Gestión de Estado

### Estado Local (useState)

Para datos específicos de un componente que no se comparten.

**Ejemplo:**

```typescript
const [loading, setLoading] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
```

### Props Drilling

Para comunicación padre-hijo en jerarquías cortas.

**Ejemplo:**

```typescript
<ServiceSearch
  quotationEnabled={isQuotationEnabled}
  onServicesChange={handleServicesChange}
/>
```

### Context API (Futuro)

Para estado compartido entre múltiples componentes distantes.

**Casos de uso:**

- Usuario autenticado
- Configuración global
- Tema/idioma

---

## Comunicación con APIs

### Cliente Axios Configurado

```typescript
// services/api.ts
const api = axios.create({
  baseURL: Config.API_ANEXO_URL,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Múltiples Clientes para Diferentes APIs

```typescript
// OutSystems API
const outsystemsApi = axios.create({
  baseURL: Config.API_OUTSYSTEMS_URL,
});

// Anexo API
const anexoApi = axios.create({
  baseURL: Config.API_ANEXO_URL,
});
```

---

## Plan de Implementación por Fases

### **FASE 1: Fundamentos** ✅ (Completada)

**Objetivo:** Establecer la base arquitectónica

**Entregables:**

- ✅ Estructura de carpetas modular
- ✅ Componentes shared (Card, FormLabel)
- ✅ Servicios base (api.ts, Config.js)
- ✅ Tipos TypeScript centralizados
- ✅ Flujo completo de creación de referencia ambulatoria

**Componentes:**

- AffiliateSearch
- SupplierSearch
- AttentionInfo
- ServiceSearch (con 5 tipos de búsqueda)
- ContractSearch
- SaveReference

**Servicios:**

- AffiliateService
- SupplierService
- HealthcareServicesService
- SubCodeService
- SuppliesAndDevicesService
- PackageService
- LogisticSupportService
- FinalityService
- CauseService
- AttentionPriorityService
- AttentionModalityService
- ServiceGroupService
- TypeCareRequestedService

---

### **FASE 2: Optimización y Reutilización** (Próxima)

**Objetivo:** Extraer lógica reutilizable y mejorar performance

**Tareas:**

1. **Custom Hooks**

   ```typescript
   // hooks/useServiceSearch.ts
   export const useServiceSearch = (entityType) => {
     const [results, setResults] = useState([]);
     const [loading, setLoading] = useState(false);

     const search = async (term) => {
       // Lógica de búsqueda unificada
     };

     return { results, loading, search };
   };
   ```

2. **Componentes Genéricos**

   - `SearchableSelect` - Select con búsqueda y debounce
   - `DataTable` - Tabla con paginación y acciones
   - `FormSection` - Sección de formulario con header

3. **Utilidades**

   ```typescript
   // utils/formatters.ts
   export const formatCurrency = (value: number) => {
     return `$${value.toLocaleString("es-CO")}`;
   };

   // utils/validators.ts
   export const validateDocument = (type: string, number: string) => {
     // Validación de documentos
   };
   ```

4. **Caché de Datos**
   - Implementar caché en servicios para catálogos
   - Evitar llamadas repetidas a APIs de datos estáticos

---

### **FASE 3: Estado Global y Context** (Futura)

**Objetivo:** Centralizar estado compartido

**Implementación:**

1. **AuthContext**

   ```typescript
   const AuthContext = createContext();

   export const AuthProvider = ({ children }) => {
     const [user, setUser] = useState(null);
     const [permissions, setPermissions] = useState([]);

     return (
       <AuthContext.Provider value={{ user, permissions }}>
         {children}
       </AuthContext.Provider>
     );
   };
   ```

2. **ConfigContext**

   - Configuración de aplicación
   - Catálogos globales
   - Preferencias de usuario

3. **NotificationContext**
   - Manejo centralizado de notificaciones
   - Toast messages
   - Alertas globales

---

### **FASE 4: Testing y Calidad** (Futura)

**Objetivo:** Garantizar calidad y mantenibilidad

**Tareas:**

1. **Unit Tests**

   - Tests para servicios
   - Tests para utilidades
   - Tests para hooks

2. **Integration Tests**

   - Tests de flujos completos
   - Tests de componentes integrados

3. **E2E Tests**

   - Tests de usuario final
   - Cypress o Playwright

4. **Code Quality**
   - ESLint configurado
   - Prettier para formato
   - Husky para pre-commit hooks

---

### **FASE 5: Performance y Optimización** (Futura)

**Objetivo:** Mejorar rendimiento y experiencia de usuario

**Tareas:**

1. **Code Splitting**

   ```typescript
   const AmbulatoryCreate = lazy(() => import("./pages/AmbulatoryCreate"));
   ```

2. **Memoization**

   ```typescript
   const MemoizedServiceSearch = memo(ServiceSearch);
   ```

3. **Virtual Scrolling**

   - Para listas largas
   - Tablas con muchos registros

4. **Optimistic Updates**
   - Actualizar UI antes de respuesta del servidor
   - Mejor UX

---

### **FASE 6: Módulos Adicionales** (Futura)

**Objetivo:** Expandir funcionalidades

**Nuevos Módulos:**

1. **Autorizaciones**

   - Solicitud de autorizaciones
   - Seguimiento de autorizaciones
   - Aprobación/rechazo

2. **Facturación**

   - Generación de facturas
   - Consulta de facturas
   - Reportes

3. **Reportes y Analytics**
   - Dashboard
   - Gráficos y estadísticas
   - Exportación de datos

---

## Mejores Prácticas

### 1. **Nomenclatura Consistente**

```typescript
// Componentes: PascalCase
AffiliateSearch.tsx;

// Servicios: camelCase con .service
affiliate.service.ts;

// Hooks: camelCase con 'use' prefix
useDebounce.ts;

// Tipos: PascalCase
interface Affiliate {}

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = "...";
```

### 2. **Comentarios Significativos**

```typescript
// ❌ Malo
// Buscar afiliado
const search = () => {};

// ✅ Bueno
/**
 * Busca afiliados por documento o nombre con debounce de 500ms
 * @param searchTerm - Término de búsqueda (mínimo 3 caracteres)
 * @returns Promise con lista de afiliados encontrados
 */
const searchAffiliate = async (searchTerm: string) => {};
```

### 3. **Manejo de Errores**

```typescript
try {
  const data = await service.getData();
  setData(data);
} catch (error: any) {
  console.error("Error fetching data:", error);
  message.error(error.message || "Error al cargar datos");
} finally {
  setLoading(false);
}
```

### 4. **Validación de Datos**

```typescript
const isDataComplete = () => {
  return !!(
    affiliate &&
    supplier &&
    services.length > 0 &&
    isContractConfirmed
  );
};
```

### 5. **Componentes Pequeños**

- Máximo 300 líneas por componente
- Si es más grande, dividir en sub-componentes
- Una responsabilidad por componente

---

## Métricas de Éxito

### Código

- ✅ Cobertura de tests > 80%
- ✅ Complejidad ciclomática < 10
- ✅ Duplicación de código < 3%

### Performance

- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Lighthouse Score > 90

### Mantenibilidad

- ✅ Tiempo de onboarding < 1 semana
- ✅ Tiempo de fix de bugs < 2 días
- ✅ Tiempo de nuevas features < 1 sprint

---

## Conclusión

Esta arquitectura permite:

1. **Crecimiento Incremental** - Agregar módulos sin afectar existentes
2. **Mantenibilidad** - Código organizado y fácil de entender
3. **Escalabilidad** - Preparado para crecer
4. **Calidad** - Patrones y prácticas probadas
5. **Velocidad** - Desarrollo ágil con componentes reutilizables

**Próximos Pasos:**

1. Completar Fase 2 (Optimización)
2. Implementar testing (Fase 4)
3. Expandir a nuevos módulos (Fase 6)
