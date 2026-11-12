# Cuotix: Fases de Implementación

> Guía de implementación por fases con tests obligatorios.
> Aprobado: 2026-11-12

---

## Reglas Obligatorias

Antes de pasar a la siguiente fase, **DEBEN cumplirse**:

1. **Unit tests** para cada funcionalidad implementada
2. **Integration tests** para grupos de funcionalidades relacionadas
3. **Verificación** de que cumple con los requisitos y especificaciones
4. **Commit** solo después de que todo lo anterior pase

```
[Implementar] → [Unit Tests] → [Integration Tests] → [Verificar] → [Commit] → [Siguiente Fase]
```

---

## Fase 0: Setup del Proyecto

### Objetivo
Estructura base del monorepo, configuración de herramientas y esquema de BD.

### Tareas

#### Backend
- [ ] Inicializar proyecto Node.js + TypeScript + Express
- [ ] Configurar Prisma con PostgreSQL
- [ ] Crear schema.prisma completo (todos los modelos)
- [ ] Configurar Docker Compose (API + PostgreSQL)
- [ ] Configurar Jest + Supertest
- [ ] Crear helpers de test (db, factories, auth)
- [ ] Variables de entorno (.env.example)

#### Mobile
- [ ] Inicializar proyecto Expo + TypeScript
- [ ] Configurar Expo Router (estructura de carpetas)
- [ ] Configurar jest-expo + React Native Testing Library
- [ ] Instalar dependencias base (RTK, Zod, etc.)

#### Docs
- [ ] README.md con instrucciones de setup

### Tests Requeridos
- [ ] `backend`: Conexión a BD de prueba funciona
- [ ] `backend`: Migraciones se ejecutan correctamente
- [ ] `mobile`: App inicia sin errores

### Commit
```
feat: setup inicial del proyecto

- Backend: Express + Prisma + PostgreSQL
- Mobile: Expo + TypeScript + Expo Router
- Docker Compose para desarrollo local
- Configuración de tests
```

---

## Fase 1: Autenticación

### Objetivo
Sistema completo de auth con JWT, refresh tokens y manejo seguro de sesión.

### Tareas

#### Backend
- [ ] `POST /auth/register` - Registro con validación Zod
- [ ] `POST /auth/login` - Login con hash verification
- [ ] `POST /auth/refresh` - Rotación de refresh tokens
- [ ] `POST /auth/logout` - Invalidar tokens
- [ ] `GET /me` - Perfil del usuario autenticado
- [ ] `PATCH /me` - Actualizar perfil
- [ ] Middleware de autenticación JWT
- [ ] Hash de passwords con Argon2/bcrypt
- [ ] Rate limiting en login/register

#### Mobile
- [ ] `authSlice` en Redux (estado de sesión)
- [ ] Almacenamiento seguro de tokens (expo-secure-store)
- [ ] Interceptor para refresh automático
- [ ] Pantalla Login
- [ ] Pantalla Register
- [ ] Lógica de logout

### Tests Requeridos

#### Unit Tests (Backend)
```typescript
// services/auth.test.ts
- [ ] hashPassword genera hash válido
- [ ] verifyPassword valida correctamente
- [ ] generateAccessToken crea JWT válido
- [ ] generateRefreshToken crea token y guarda hash
- [ ] validateRefreshToken detecta token inválido/expirado
- [ ] revokeAllUserTokens elimina todos los refresh tokens
```

#### Integration Tests (Backend)
```typescript
// integration/auth.test.ts
- [ ] POST /auth/register - crea usuario y retorna tokens
- [ ] POST /auth/register - rechaza email duplicado (409)
- [ ] POST /auth/register - valida campos requeridos (400)
- [ ] POST /auth/login - retorna tokens con credenciales válidas
- [ ] POST /auth/login - rechaza credenciales inválidas (401)
- [ ] POST /auth/refresh - rota tokens correctamente
- [ ] POST /auth/refresh - revoca todos si token ya usado
- [ ] POST /auth/logout - invalida refresh token
- [ ] GET /me - retorna usuario autenticado
- [ ] GET /me - rechaza sin token (401)
- [ ] GET /me - rechaza con token expirado (401)
```

#### Unit Tests (Mobile)
```typescript
// authSlice.test.ts
- [ ] setCredentials guarda usuario y tokens
- [ ] clearCredentials limpia estado
- [ ] selectIsAuthenticated retorna correcto
```

### Commit
```
feat(auth): sistema de autenticación completo

- Registro, login, logout, refresh
- JWT con rotación de refresh tokens
- Rate limiting en endpoints sensibles
- Tests unitarios y de integración
```

---

## Fase 2: Componentes Base UI

### Objetivo
Componentes reutilizables accesibles que se usarán en toda la app.

### Tareas

#### Theme
- [ ] `theme/colors.ts` - Paleta light y dark
- [ ] `theme/typography.ts` - Tamaños y estilos de texto
- [ ] `theme/spacing.ts` - Espaciado y áreas táctiles
- [ ] `ThemeProvider` con soporte dark/light
- [ ] `settingsSlice` - Preferencias (tema, contraste, háptica)

#### Componentes Base (Fase 2)
- [ ] `AppText` - Texto escalable con variantes
- [ ] `AppButton` - Botón accesible con estados
- [ ] `AppInput` - Input con label, error, hint
- [ ] `AppCard` - Card presionable/informativa
- [ ] `StatusBadge` - Badge de estado con icono+texto
- [ ] `AppScreen` - Wrapper de pantalla con loading/error
- [ ] `AppModal` - Modal/bottom sheet accesible
- [ ] `AppIcon` - Wrapper de iconos con a11y

#### Componentes Adicionales (se crean cuando se necesitan)
- `AppList` - FlatList wrapper → Fase 3 (listas de grupos)
- `AppEmptyState` - Estado vacío → Fase 3 (explorar sin resultados)
- `AppAvatar` - Avatar de usuario → Fase 4 (lista de miembros)
- `AppDivider` - Separador → Fase 3
- `AppChip` - Filtros/tags → Fase 3 (filtros de búsqueda)
- `AppRating` - Estrellas de calificación → Fase 7

### Tests Requeridos

#### Unit Tests (Mobile)
```typescript
// components/AppButton.test.tsx
- [ ] tiene accessibilityRole="button"
- [ ] tiene accessibilityLabel con el título
- [ ] accessibilityState.disabled cuando disabled
- [ ] accessibilityState.busy cuando loading
- [ ] no ejecuta onPress si disabled
- [ ] altura mínima ≥48dp

// components/AppInput.test.tsx
- [ ] muestra label visible
- [ ] accessibilityLabel incluye "requerido" si required
- [ ] muestra error con icono y texto
- [ ] error tiene accessibilityLiveRegion="polite"
- [ ] área táctil ≥48dp

// components/StatusBadge.test.tsx
- [ ] muestra icono para cada estado
- [ ] muestra texto para cada estado
- [ ] accessibilityLabel descriptivo

// components/AppCard.test.tsx
- [ ] accessibilityRole="button" si onPress
- [ ] accessibilityRole="summary" si no onPress
- [ ] accessibilityLabel requerido

// components/AppText.test.tsx
- [ ] allowFontScaling es true
- [ ] aplica variante correcta
- [ ] soporta accessibilityRole="header"

// components/AppScreen.test.tsx
- [ ] muestra loading con accessibilityLabel
- [ ] muestra error con accessibilityLiveRegion
```

### Commit
```
feat(ui): componentes base accesibles

- AppText, AppButton, AppInput, AppCard, StatusBadge
- AppScreen, AppModal, AppIcon
- Sistema de temas light/dark
- Tests de accesibilidad para cada componente
```

---

## Fase 3: Servicios y Grupos

### Objetivo
CRUD de grupos y catálogo de servicios.

### Tareas

#### Backend
- [ ] Seed de servicios (Spotify, YouTube, Netflix)
- [ ] `GET /services` - Listar servicios
- [ ] `GET /services/:id` - Detalle de servicio
- [ ] `POST /groups` - Crear grupo (validar slots vs maxMembers)
- [ ] `GET /groups` - Listar grupos (filtros, paginación)
- [ ] `GET /groups/:id` - Detalle (ocultar payoutDetail según permisos)
- [ ] `PATCH /groups/:id` - Actualizar grupo (solo owner)
- [ ] `POST /groups/:id/close` - Cerrar grupo

#### Mobile
- [ ] RTK Query endpoints (services, groups)
- [ ] Pantalla Home (mis grupos)
- [ ] Pantalla Explore (buscar grupos)
- [ ] Pantalla Group Detail
- [ ] Pantalla Create Group
- [ ] Componente GroupCard

### Tests Requeridos

#### Unit Tests (Backend)
```typescript
// services/groups.test.ts
- [ ] createGroup valida slots <= maxMembers - 1
- [ ] createGroup asigna owner correctamente
- [ ] updateGroup solo permite al owner
- [ ] closeGroup cambia estado a CLOSED
- [ ] closeGroup falla si hay pagos MARKED_PAID
- [ ] getGroupDetail oculta payoutDetail a no miembros
- [ ] getGroupDetail muestra payoutDetail a miembros ACTIVE
```

#### Integration Tests (Backend)
```typescript
// integration/groups.test.ts
- [ ] POST /groups - crea grupo correctamente
- [ ] POST /groups - valida slots vs maxMembers (400)
- [ ] GET /groups - retorna solo grupos OPEN por defecto
- [ ] GET /groups - filtra por serviceId
- [ ] GET /groups - paginación funciona
- [ ] GET /groups/:id - oculta payoutDetail a extraños
- [ ] GET /groups/:id - muestra payoutDetail a miembros
- [ ] PATCH /groups/:id - solo owner puede editar (403)
- [ ] POST /groups/:id/close - cierra y cancela cuotas
- [ ] POST /groups/:id/close - falla con pagos pendientes (409)
```

#### Unit Tests (Mobile)
```typescript
// components/GroupCard.test.tsx
- [ ] muestra nombre del servicio
- [ ] muestra slots disponibles
- [ ] muestra precio
- [ ] accessibilityLabel descriptivo completo
```

### Commit
```
feat(groups): gestión de grupos y servicios

- CRUD de grupos con validación de cupos
- Catálogo de servicios (seed)
- Filtros y paginación
- Protección de datos de pago
- Tests unitarios y de integración
```

---

## Fase 4: Membresías

### Objetivo
Ciclo completo de membresías: solicitar, aprobar, confirmar acceso, salir/expulsar.

### Tareas

#### Backend
- [ ] `POST /groups/:id/join` - Solicitar unirse
- [ ] `GET /groups/:id/members` - Listar miembros
- [ ] `PATCH /memberships/:id/approve` - Aprobar (con firstAmount)
- [ ] `PATCH /memberships/:id/reject` - Rechazar
- [ ] `POST /memberships/:id/confirm-access` - Confirmar acceso
- [ ] `POST /memberships/:id/leave` - Salir del grupo
- [ ] `POST /memberships/:id/remove` - Expulsar (owner)
- [ ] Validación transaccional de cupos al aprobar
- [ ] Crear primera cuota al confirmar acceso

#### Mobile
- [ ] RTK Query endpoints (memberships)
- [ ] Pantalla Members List
- [ ] Pantalla Join Request (solicitar)
- [ ] UI para aprobar/rechazar solicitudes
- [ ] UI para confirmar acceso
- [ ] Componente MemberCard

### Tests Requeridos

#### Unit Tests (Backend)
```typescript
// services/memberships.test.ts
- [ ] joinGroup crea membresía PENDING
- [ ] joinGroup falla si ya es miembro
- [ ] joinGroup falla si grupo FULL
- [ ] approveMembership valida cupos en transacción
- [ ] approveMembership guarda firstAmount
- [ ] confirmAccess cambia a ACTIVE
- [ ] confirmAccess crea primera cuota
- [ ] confirmAccess falla si no está APPROVED
- [ ] removeMember falla si < 2 cuotas OVERDUE
- [ ] leaveMembership establece leavesAt
```

#### Integration Tests (Backend)
```typescript
// integration/memberships.test.ts
- [ ] POST /groups/:id/join - crea solicitud
- [ ] POST /groups/:id/join - falla si ya miembro (409)
- [ ] POST /groups/:id/join - falla si grupo full (409)
- [ ] PATCH /memberships/:id/approve - valida cupos concurrentes
- [ ] PATCH /memberships/:id/approve - solo owner (403)
- [ ] PATCH /memberships/:id/approve - guarda firstAmount
- [ ] POST /memberships/:id/confirm-access - crea cuota
- [ ] POST /memberships/:id/confirm-access - solo el miembro (403)
- [ ] POST /memberships/:id/remove - requiere 2 OVERDUE (409)
```

### Commit
```
feat(memberships): ciclo de vida de membresías

- Solicitar, aprobar, rechazar, confirmar acceso
- Salir y expulsar con reglas de negocio
- Control transaccional de cupos
- Generación de primera cuota
- Tests unitarios y de integración
```

---

## Fase 5: Cuotas y Pagos

### Objetivo
Sistema completo de cuotas con transiciones de estado.

### Tareas

#### Backend
- [ ] `GET /me/payments` - Mis cuotas
- [ ] `GET /groups/:id/payments` - Cuotas del grupo (owner)
- [ ] `GET /payments/:id` - Detalle de cuota
- [ ] `POST /payments/:id/mark-paid` - Marcar como pagado
- [ ] `POST /payments/:id/confirm` - Confirmar pago (owner)
- [ ] `POST /payments/:id/reject` - Rechazar con motivo
- [ ] Validar transiciones de estado válidas

#### Mobile
- [ ] RTK Query endpoints (payments)
- [ ] Pantalla Payment Detail
- [ ] Pantalla Mark as Paid
- [ ] UI para confirmar/rechazar pagos
- [ ] Lista de pagos en grupo

### Tests Requeridos

#### Unit Tests (Backend)
```typescript
// services/payments.test.ts
- [ ] markAsPaid cambia PENDING → MARKED_PAID
- [ ] markAsPaid permite OVERDUE → MARKED_PAID
- [ ] markAsPaid falla desde CONFIRMED
- [ ] markAsPaid guarda referencia y fecha
- [ ] confirmPayment cambia MARKED_PAID → CONFIRMED
- [ ] confirmPayment falla desde PENDING
- [ ] rejectPayment cambia MARKED_PAID → PENDING
- [ ] rejectPayment guarda motivo y limpia markedPaidAt
- [ ] rejectPayment falla sin motivo
```

#### Integration Tests (Backend)
```typescript
// integration/payments.test.ts
- [ ] GET /me/payments - retorna solo mis cuotas
- [ ] GET /groups/:id/payments - solo owner ve todas
- [ ] POST /payments/:id/mark-paid - cambia estado
- [ ] POST /payments/:id/mark-paid - permite desde OVERDUE
- [ ] POST /payments/:id/confirm - solo owner (403)
- [ ] POST /payments/:id/confirm - transición inválida (409)
- [ ] POST /payments/:id/reject - requiere motivo (400)
- [ ] POST /payments/:id/reject - limpia markedPaidAt
```

### Commit
```
feat(payments): gestión de cuotas y pagos

- Marcar pagado, confirmar, rechazar
- Transiciones de estado validadas
- Historial de pagos
- Tests unitarios y de integración
```

---

## Fase 6: Jobs y Notificaciones

### Objetivo
Tareas programadas y sistema de notificaciones.

### Tareas

#### Backend
- [ ] Job: generatePaymentCycles (generar cuotas mensuales)
- [ ] Job: markOverdue (marcar atrasos)
- [ ] Job: sendReminders (enviar recordatorios)
- [ ] `POST /me/push-token` - Registrar token
- [ ] `GET /me/notifications` - Listar notificaciones
- [ ] `PATCH /notifications/:id/read` - Marcar leída
- [ ] `POST /me/notifications/read-all` - Marcar todas leídas
- [ ] Script CLI: `npm run jobs:run -- --date=YYYY-MM-DD`
- [ ] Ejecutar jobs al iniciar el servidor

#### Mobile
- [ ] Configurar Expo Notifications
- [ ] Registrar push token al login
- [ ] Eliminar push token al logout
- [ ] Pantalla Notifications
- [ ] Handler de notificaciones en foreground
- [ ] Invalidar RTK Query tags al recibir push

### Tests Requeridos

#### Unit Tests (Backend)
```typescript
// jobs/generatePayments.test.ts
- [ ] genera cuotas para membresías ACTIVE
- [ ] ignora grupos CLOSED
- [ ] ignora membresías LEFT/REMOVED
- [ ] es idempotente (no duplica)
- [ ] usa timezone America/Bogota

// jobs/markOverdue.test.ts
- [ ] marca OVERDUE después de 3 días de gracia
- [ ] no marca dentro de días de gracia
- [ ] ignora cuotas MARKED_PAID
- [ ] ignora membresías no ACTIVE
- [ ] guarda overdueAt

// jobs/sendReminders.test.ts
- [ ] envía recordatorio 2 días antes
- [ ] envía recordatorio día del vencimiento
- [ ] envía notificación al marcar OVERDUE
- [ ] no duplica notificaciones (unique constraint)
- [ ] elimina push tokens inválidos
```

#### Integration Tests (Backend)
```typescript
// integration/notifications.test.ts
- [ ] POST /me/push-token - registra token
- [ ] POST /me/push-token - reasigna si ya existe
- [ ] GET /me/notifications - lista paginada
- [ ] PATCH /notifications/:id/read - marca leída
- [ ] POST /me/notifications/read-all - marca todas
```

### Commit
```
feat(notifications): jobs y notificaciones

- Generación automática de cuotas mensuales
- Marcado de atrasos con días de gracia
- Recordatorios de pago
- Notificaciones in-app y push
- Script CLI para ejecutar jobs manualmente
- Tests unitarios y de integración
```

---

## Fase 7: Calificaciones y Reportes

### Objetivo
Sistema de reputación y reportes de usuarios.

### Tareas

#### Backend
- [ ] `POST /ratings` - Calificar usuario
- [ ] `GET /users/:id/ratings` - Ver calificaciones de usuario
- [ ] `POST /reports` - Reportar usuario
- [ ] `GET /reports` - Listar reportes (solo admin)
- [ ] `PATCH /reports/:id` - Actualizar estado de reporte
- [ ] Validar elegibilidad para calificar

#### Mobile
- [ ] Pantalla Rate User
- [ ] Pantalla User Profile (con rating)
- [ ] Componente AppRating (estrellas)
- [ ] UI para reportar usuario

### Tests Requeridos

#### Unit Tests (Backend)
```typescript
// services/ratings.test.ts
- [ ] createRating valida elegibilidad (cuota CONFIRMED o LEFT)
- [ ] createRating falla si ya calificó
- [ ] createRating valida score 1-5
- [ ] getUserRatings calcula promedio

// services/reports.test.ts
- [ ] createReport requiere motivo
- [ ] getReports solo admin puede acceder
- [ ] updateReport cambia estado
```

#### Integration Tests (Backend)
```typescript
// integration/ratings.test.ts
- [ ] POST /ratings - crea calificación
- [ ] POST /ratings - falla si no elegible (403)
- [ ] POST /ratings - falla si ya calificó (409)
- [ ] GET /users/:id/ratings - retorna promedio y lista

// integration/reports.test.ts
- [ ] POST /reports - crea reporte
- [ ] GET /reports - solo admin (403)
- [ ] PATCH /reports/:id - actualiza estado
```

### Commit
```
feat(ratings): calificaciones y reportes

- Sistema de calificación 1-5 estrellas
- Validación de elegibilidad
- Reportes de usuarios
- Panel de moderación (admin)
- Tests unitarios y de integración
```

---

## Fase 8: Integración y Pantallas Finales

### Objetivo
Integrar todos los flujos, pulir UI y preparar para demo.

### Tareas

#### Mobile
- [ ] Pantalla Profile completa (settings, logout)
- [ ] Navegación completa con tabs
- [ ] Estados de carga y error en todas las pantallas
- [ ] Empty states en listas vacías
- [ ] Pull to refresh en listas
- [ ] Feedback háptico en acciones importantes
- [ ] Alto contraste toggle funcional
- [ ] Deep linking básico

#### Backend
- [ ] Seed completo para demo
- [ ] Documentación OpenAPI actualizada
- [ ] Script de reset de BD para demo

#### General
- [ ] README con instrucciones completas
- [ ] Verificar accesibilidad en todas las pantallas
- [ ] Fix de bugs encontrados

### Tests Requeridos

#### Tests de pantallas (Mobile)
```typescript
// screens/Login.test.tsx
- [ ] renderiza formulario completo
- [ ] valida campos requeridos
- [ ] navega a register
- [ ] muestra error de credenciales

// screens/Home.test.tsx
- [ ] muestra grupos del usuario
- [ ] muestra empty state si no hay grupos
- [ ] navega a crear grupo

// Similar para cada pantalla...
```

### Commit
```
feat: integración completa y pantallas finales

- Navegación completa
- Estados de carga y error
- Settings de accesibilidad
- Seed para demo
- Tests de pantallas
```

---

## Fase 9: Pruebas E2E

### Objetivo
Verificar flujos completos de principio a fin.

### Herramienta
Detox (React Native) o pruebas manuales documentadas con guión.

### Flujos a Probar

#### E2E-1: Registro y Login
```
1. Abrir app
2. Tap "Crear cuenta"
3. Llenar formulario válido
4. Verificar navegación a Home
5. Cerrar sesión
6. Login con credenciales creadas
7. Verificar navegación a Home
```

#### E2E-2: Crear Grupo y Recibir Miembro
```
1. Login como owner
2. Crear grupo de Spotify
3. Verificar grupo aparece en Home
4. Logout
5. Login como member
6. Buscar grupo en Explore
7. Solicitar unirse
8. Logout
9. Login como owner
10. Aprobar solicitud
11. Logout
12. Login como member
13. Confirmar acceso
14. Verificar cuota generada
```

#### E2E-3: Ciclo de Pago Completo
```
1. Login como member con cuota pendiente
2. Ver cuota en detalle
3. Copiar datos de pago
4. Marcar como pagado con referencia
5. Verificar estado "Marcado como pagado"
6. Logout
7. Login como owner
8. Confirmar pago
9. Verificar estado "Confirmado"
10. Logout
11. Login como member
12. Calificar al owner
13. Verificar calificación guardada
```

#### E2E-4: Manejo de Errores
```
1. Intentar login con credenciales inválidas
2. Verificar mensaje de error
3. Intentar unirse a grupo lleno
4. Verificar mensaje de error
5. Activar modo avión
6. Intentar acción
7. Verificar mensaje de sin conexión
```

#### E2E-5: Accesibilidad
```
1. Activar TalkBack/VoiceOver
2. Navegar por Login con lector
3. Verificar orden de foco lógico
4. Verificar que todos los elementos se anuncian
5. Navegar por Home
6. Verificar cards se leen completas
7. Ejecutar una acción con lector activado
```

### Formato de Evidencia

```markdown
## E2E-1: Registro y Login

**Fecha:** ____
**Dispositivo:** ____
**Tester:** ____

| Paso | Acción | Esperado | Resultado | Evidencia |
|------|--------|----------|-----------|-----------|
| 1 | Abrir app | Pantalla login | ✓/✗ | screenshot_01.png |
| 2 | Tap "Crear cuenta" | Pantalla register | ✓/✗ | screenshot_02.png |
| ... | ... | ... | ... | ... |

**Bugs encontrados:**
- [ ] ...

**Estado:** PASS / FAIL
```

### Commit
```
test(e2e): pruebas end-to-end completas

- Flujo de registro y login
- Flujo de grupos y membresías
- Flujo de pagos completo
- Manejo de errores
- Accesibilidad con lectores de pantalla
- Evidencias documentadas
```

---

## Resumen de Fases

| Fase | Descripción | Dependencias |
|------|-------------|--------------|
| 0 | Setup del proyecto | - |
| 1 | Autenticación | Fase 0 |
| 2 | Componentes Base UI | Fase 0 |
| 3 | Servicios y Grupos | Fases 1, 2 |
| 4 | Membresías | Fase 3 |
| 5 | Cuotas y Pagos | Fase 4 |
| 6 | Jobs y Notificaciones | Fase 5 |
| 7 | Calificaciones y Reportes | Fase 5 |
| 8 | Integración Final | Fases 6, 7 |
| 9 | Pruebas E2E | Fase 8 |

---

## Checklist de Commit por Fase

Usar este checklist antes de cada commit:

```markdown
## Pre-commit Checklist - Fase X

- [ ] Todas las tareas de la fase completadas
- [ ] Unit tests escritos y pasando
- [ ] Integration tests escritos y pasando
- [ ] Código cumple con las especificaciones
- [ ] No hay errores de lint
- [ ] No hay errores de TypeScript
- [ ] Probado manualmente (funciona)
- [ ] Revisado que no hay console.logs olvidados
- [ ] Revisado que no hay credenciales hardcodeadas
```

---

## Decisiones de implementación

<!-- Decision: 2026-11-12 -->
**Estructura del repositorio (Fase 0).** El proyecto Expo ya existía en la raíz, con rutas en `src/app/` (según `AGENTS.md`). En lugar de moverlo a `mobile/`, la app móvil permanece en la raíz y el backend vive en `backend/` con su propio `package.json`. El `docker-compose.yml` está en la raíz.

<!-- Decision: 2026-11-12 -->
**Prisma 7.** Se usa Prisma 7 con driver adapter (`@prisma/adapter-pg`), `prisma.config.ts` y generador `prisma-client` con `moduleFormat = "cjs"` (necesario para ts-jest). El cliente se genera en `backend/generated/prisma` (ignorado por git). TypeScript del backend queda en 5.9 por compatibilidad con ts-jest.

<!-- Decision: 2026-11-12 -->
**Credenciales de desarrollo.** El rol/BD local es `cuotix`/`cuotix`. `backend/.env.test` se versiona porque solo contiene valores de prueba; `backend/.env` está ignorado.
