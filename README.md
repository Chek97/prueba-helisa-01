# Sistema de Gestión Jerárquica del Plan Único de Cuentas (PUC)

Solución full-stack para la gestión, consulta jerárquica y validación de cuentas contables conforme a la normatividad del Plan Único de Cuentas (PUC), desarrollada con **NestJS**, **React 19**, **TypeScript**, **TypeORM (SQLite)** y **Vite**.

---

## 🚀 Cómo correr el proyecto

### Requisitos previos
- **Node.js 22** (definido en `.nvmrc`; puedes usar `nvm use`).
- **npm 10 o superior** (`npm -v`).

### Puesta en marcha rápida

```bash
# 1. Instalar dependencias en raíz, api/ y web/
npm install

# 2. Levantar API y Frontend simultáneamente
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **API Backend:** [http://localhost:3000](http://localhost:3000) (Endpoints bajo `/accounts`)

### Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia backend (`api`) y frontend (`web`) concurrentemente en modo desarrollo |
| `npm run dev:api` | Ejecuta únicamente la API de NestJS |
| `npm run dev:web` | Ejecuta únicamente el cliente web de Vite |
| `npm run build` | Compila ambos proyectos con TypeScript y Vite |
| `npm test` | Ejecuta la suite de **52 pruebas unitarias** en Vitest |
| `npm run lint` | Valida el código con `oxlint` (0 advertencias, 0 errores) |

---

## 📦 Entregables y Funcionalidades

### 1. Backend (NestJS + Clean Architecture & DDD)

El backend fue estructurado desacoplando la lógica de negocio de la infraestructura mediante Clean Architecture y principios de Domain-Driven Design (DDD):

- **Capa de Dominio (`api/src/accounts/domain/`):**
  - **Entidad `Account`:** Modela la cuenta contable y sus invariantes de negocio.
  - **Value Objects:**
    - `AccountCode`: Valida formato numérico y longitudes permitidas: **1** (Clase), **2** (Grupo), **4** (Cuenta) y **6** (Subcuenta). Deduce automáticamente el nivel jerárquico y el código padre por prefijo.
    - `AccountNature`: Valida y tipifica la naturaleza contable (`DEBITO` o `CREDITO`).
  - **Reglas de negocio contable:**
    - Las Clases definen su propia naturaleza.
    - Grupos, Cuentas y Subcuentas heredan la naturaleza de su Clase raíz.
    - Una cuenta no-Clase no puede crearse si su padre no existe previamente.
    - Una cuenta no puede eliminarse si contiene cuentas hijas asociadas.
  - **Manejo semántico de errores (`AccountErrors` / `DomainError`):** Errores tipados como `PARENT_NOT_FOUND`, `ACCOUNT_HAS_CHILDREN`, `CODE_ALREADY_EXISTS`, `INVALID_CODE_FORMAT`.
- **Capa de Aplicación (`api/src/accounts/application/`):**
  - `CreateAccountUseCase`: Valida unicidad, formato, existencia del padre y persiste la cuenta.
  - `DeleteAccountUseCase`: Verifica que no existan hijas antes de eliminar.
  - `ListAccountsUseCase`: Construye el catálogo jerárquico en memoria como árbol en tiempo lineal **$O(N)$**, calculando la naturaleza heredada e indicador `isLeaf`.
  - `GetAccountUseCase`: Recupera una cuenta individual por código exacto.
- **Capa de Infraestructura (`api/src/accounts/infrastructure/`):**
  - Persistencia relacional con TypeORM y base de datos SQLite persistente (`database.sqlite`).
  - `AccountsController`: Endpoints REST (`GET /accounts`, `GET /accounts/:code`, `POST /accounts`, `DELETE /accounts/:code`).
  - `DomainExceptionFilter`: Mapea excepciones del dominio a respuestas HTTP consistentes con códigos de estado semánticos (`400`, `404`, `409`, `422`).
- **Pruebas Automatizadas:** 52 pruebas unitarias exhaustivas con Vitest cubriendo todos los casos de uso y reglas de validación.

---

### 2. Frontend (React 19 + TypeScript + Patrón Feature)

Implementado bajo el **Patrón Feature** en `web/src/features/accounts/` para máxima cohesión y mantenibilidad:

- **Catálogo Jerárquico en Acordeón (`AccountTree` & `AccountTreeNodeItem`):**
  - Visualización multinivel con indentación jerárquica: Clase $\rightarrow$ Grupo $\rightarrow$ Cuenta $\rightarrow$ Subcuenta.
  - Cada nodo con hijos opera como acordeón colapsable/expandible con indicadores de estado y contador de subcuentas.
  - Acciones rápidas globales: **Expandir todo**, **Colapsar todo** y **Refrescar catálogo**.
  - **Búsqueda en tiempo real:** Filtra por código o nombre preservando la cadena de ancestros para contextualizar cada cuenta.
  - Badges de color por nivel y naturaleza contable (`DÉBITO` / `CRÉDITO`).
- **Eliminación Segura con Confirmación y Notificación:**
  - Botón de eliminar (papelera) integrado en la fila de cada cuenta.
  - **Confirmación interactiva (`ConfirmDialog`):** Modal accesible (`role="alertdialog"`) que solicita confirmación explícita antes de ejecutar la acción.
  - **Notificaciones Toast (`ToastContainer` / `Toast`):** Si la cuenta tiene hijas o la API rechaza el borrado, se notifica el motivo específico en un Toast de error. Si la eliminación es exitosa, se notifica y se actualiza el catálogo y las métricas automáticamente.
- **Formulario Inteligente de Creación (`AccountForm`):**
  - **Validación en vivo:** Comprueba que el código contenga únicamente dígitos y tenga longitud permitida (1, 2, 4 o 6).
  - **Comprobación de existencia del padre antes de guardar:**
    - Si es Clase (1 dígito): Requiere seleccionar naturaleza (`DÉBITO` o `CRÉDITO`) y no solicita padre.
    - Si es Grupo, Cuenta o Subcuenta: Deriva automáticamente el código del padre y comprueba si existe en el catálogo. Si el padre **no existe**, muestra advertencia interactiva y **bloquea el guardado** previniendo errores. Si existe, muestra validación positiva (`✓ Padre válido: [código] - [nombre]`) y la naturaleza heredada.
  - **Atajo "+ Hijo":** Permite hacer clic en cualquier cuenta del árbol para pre-cargar el formulario con el código padre.
- **Panel Principal y Métricas (`AccountsPage`):**
  - Barra de estadísticas con conteo dinámico: Total de cuentas, Clases, Grupos, Cuentas y Subcuentas.
  - Tarjeta de referencia con las directrices contables del PUC.
  - Diseño responsivo en tema oscuro adaptado con variables CSS y animaciones fluidas.

---

## 📐 Decisiones de Arquitectura y Diseño

1. **Clean Architecture / DDD en Backend:**
   - La lógica contable del PUC no depende de NestJS ni de TypeORM. Las entidades y Value Objects contienen sus propias invariantes.
   - Se aplicó el principio de inversión de dependencias: los casos de uso dependen de una interfaz de repositorio (`AccountRepository`), facilitando el testing unitario con mocks y el cambio de motor de base de datos sin alterar la lógica de negocio.
2. **Construcción del Árbol en $O(N)$:**
   - En lugar de realizar consultas recursivas a la base de datos (problema de N+1 queries), el backend recupera las cuentas ordenadas y construye la jerarquía en un solo paso mediante un mapa de nodos por código.
3. **Patrón Feature en Frontend:**
   - Todo lo relacionado con cuentas contables (`types`, `service`, `useAccounts`, `utils` y componentes visuales) reside encapsulado en `web/src/features/accounts/`.
   - Los componentes transversales (`Toast`, `ConfirmDialog`) son agnósticos y reutilizables en `web/src/components/`.
4. **Validación Dual (Cliente y Servidor):**
   - El cliente valida formatos, longitud y existencia de la cuenta padre en tiempo real para otorgar feedback inmediato al usuario.
   - El backend vuelve a validar de forma estricta e independiente en la capa de dominio, garantizando la integridad de los datos.
5. **Cero Dependencias UI Externas:**
   - Se diseñó un sistema de diseño propio y ligero con variables CSS modernas (design tokens), accesibilidad nativa y alto rendimiento, evitando sobrecargar el bundle con librerías pesadas.

---

## 🔮 Qué se dejó afuera y qué se haría con más tiempo

1. **Edición y Renombrado:** Implementar un flujo modal para actualizar el nombre de una cuenta existente sin alterar su código ni su jerarquía.
2. **Importación / Exportación Masiva:** Capacidad de cargar y descargar catálogos completos en formato CSV o Excel con validación previa en lote.
3. **Virtualización de Lista:** Integrar virtualización (ej. `@tanstack/react-virtual`) en el árbol en caso de que el catálogo contenga decenas de miles de cuentas contables.
4. **Pruebas End-to-End (E2E):** Implementar pruebas de integración completas frontend-backend usando Playwright o Cypress.
5. **Auditoría Contable:** Registro de bitácora histórica de transacciones (quién creó, modificó o eliminó cada cuenta y en qué momento).
