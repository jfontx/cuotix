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
- [x] Inicializar proyecto Node.js + TypeScript + Express
- [x] Configurar Prisma con PostgreSQL
- [x] Crear schema.prisma completo (todos los modelos)
- [x] Configurar Docker Compose (API + PostgreSQL)
- [x] Configurar Jest + Supertest
- [x] Crear helpers de test (db, factories, auth)
- [x] Variables de entorno (.env.example)

#### Mobile
- [x] Inicializar proyecto Expo + TypeScript
- [x] Configurar Expo Router (estructura de carpetas)
- [x] Configurar jest-expo + React Native Testing Library
- [x] Instalar dependencias base (RTK, Zod, etc.)

#### Docs
- [x] README.md con instrucciones de setup

### Tests Requeridos
- [x] `backend`: Conexión a BD de prueba funciona
- [x] `backend`: Migraciones se ejecutan correctamente
- [x] `mobile`: App inicia sin errores

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
- [x] `POST /auth/register` - Registro con validación Zod
- [x] `POST /auth/login` - Login con hash verification
- [x] `POST /auth/refresh` - Rotación de refresh tokens
- [x] `POST /auth/logout` - Invalidar tokens
- [x] `GET /me` - Perfil del usuario autenticado
- [x] `PATCH /me` - Actualizar perfil
- [x] Middleware de autenticación JWT
- [x] Hash de passwords con Argon2/bcrypt
- [x] Rate limiting en login/register

#### Mobile
- [x] `authSlice` en Redux (estado de sesión)
- [x] Almacenamiento seguro de tokens (expo-secure-store)
- [x] Interceptor para refresh automático
- [x] Pantalla Login
- [x] Pantalla Register
- [x] Lógica de logout

### Tests Requeridos

#### Unit Tests (Backend)
```typescript
// services/auth.test.ts
- [x] hashPassword genera hash válido
- [x] verifyPassword valida correctamente
- [x] generateAccessToken crea JWT válido
- [x] generateRefreshToken crea token y guarda hash
- [x] validateRefreshToken detecta token inválido/expirado
- [x] revokeAllUserTokens elimina todos los refresh tokens
```

#### Integration Tests (Backend)
```typescript
// integration/auth.test.ts
- [x] POST /auth/register - crea usuario y retorna tokens
- [x] POST /auth/register - rechaza email duplicado (409)
- [x] POST /auth/register - valida campos requeridos (400)
- [x] POST /auth/login - retorna tokens con credenciales válidas
- [x] POST /auth/login - rechaza credenciales inválidas (401)
- [x] POST /auth/refresh - rota tokens correctamente
- [x] POST /auth/refresh - revoca todos si token ya usado
- [x] POST /auth/logout - invalida refresh token
- [x] GET /me - retorna usuario autenticado
- [x] GET /me - rechaza sin token (401)
- [x] GET /me - rechaza con token expirado (401)
```

#### Unit Tests (Mobile)
```typescript
// authSlice.test.ts
- [x] setCredentials guarda usuario y tokens
- [x] clearCredentials limpia estado
- [x] selectIsAuthenticated retorna correcto
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
- [x] `theme/colors.ts` - Paleta light y dark
- [x] `theme/typography.ts` - Tamaños y estilos de texto
- [x] `theme/spacing.ts` - Espaciado y áreas táctiles
- [x] `ThemeProvider` con soporte dark/light
- [x] `settingsSlice` - Preferencias (tema, contraste, háptica)

#### Componentes Base (Fase 2)
- [x] `AppText` - Texto escalable con variantes
- [x] `AppButton` - Botón accesible con estados
- [x] `AppInput` - Input con label, error, hint
- [x] `AppCard` - Card presionable/informativa
- [x] `StatusBadge` - Badge de estado con icono+texto
- [x] `AppScreen` - Wrapper de pantalla con loading/error
- [x] `AppModal` - Modal/bottom sheet accesible
- [x] `AppIcon` - Wrapper de iconos con a11y

#### Componentes Adicionales (se crean cuando se necesitan)
- `AppList` - FlatList wrapper → Fase 3 ✅ (listas de grupos)
- `AppEmptyState` - Estado vacío → Fase 3 ✅ (explorar sin resultados)
- `AppAvatar` - Avatar de usuario → Fase 4 ✅ (lista de miembros)
- `AppDivider` - Separador → Fase 3 ✅
- `AppChip` - Filtros/tags → Fase 3 ✅ (filtros de búsqueda)
- `AppRating` - Estrellas de calificación → Fase 7

### Tests Requeridos

#### Unit Tests (Mobile)
```typescript
// components/AppButton.test.tsx
- [x] tiene accessibilityRole="button"
- [x] tiene accessibilityLabel con el título
- [x] accessibilityState.disabled cuando disabled
- [x] accessibilityState.busy cuando loading
- [x] no ejecuta onPress si disabled
- [x] altura mínima ≥48dp

// components/AppInput.test.tsx
- [x] muestra label visible
- [x] accessibilityLabel incluye "requerido" si required
- [x] muestra error con icono y texto
- [x] error tiene accessibilityLiveRegion="polite"
- [x] área táctil ≥48dp

// components/StatusBadge.test.tsx
- [x] muestra icono para cada estado
- [x] muestra texto para cada estado
- [x] accessibilityLabel descriptivo

// components/AppCard.test.tsx
- [x] accessibilityRole="button" si onPress
- [x] accessibilityRole="summary" si no onPress
- [x] accessibilityLabel requerido

// components/AppText.test.tsx
- [x] allowFontScaling es true
- [x] aplica variante correcta
- [x] soporta accessibilityRole="header"

// components/AppScreen.test.tsx
- [x] muestra loading con accessibilityLabel
- [x] muestra error con accessibilityLiveRegion
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
- [x] Seed de servicios (Spotify, YouTube, Netflix)
- [x] `GET /services` - Listar servicios
- [x] `GET /services/:id` - Detalle de servicio
- [x] `POST /groups` - Crear grupo (validar slots vs maxMembers)
- [x] `GET /groups` - Listar grupos (filtros, paginación)
- [x] `GET /groups/:id` - Detalle (ocultar payoutDetail según permisos)
- [x] `PATCH /groups/:id` - Actualizar grupo (solo owner)
- [x] `POST /groups/:id/close` - Cerrar grupo

#### Mobile
- [x] RTK Query endpoints (services, groups)
- [x] Pantalla Home (mis grupos)
- [x] Pantalla Explore (buscar grupos)
- [x] Pantalla Group Detail
- [x] Pantalla Create Group
- [x] Componente GroupCard

### Tests Requeridos

#### Unit Tests (Backend)
```typescript
// services/groups.test.ts
- [x] createGroup valida slots <= maxMembers - 1
- [x] createGroup asigna owner correctamente
- [x] updateGroup solo permite al owner
- [x] closeGroup cambia estado a CLOSED
- [x] closeGroup falla si hay pagos MARKED_PAID
- [x] getGroupDetail oculta payoutDetail a no miembros
- [x] getGroupDetail muestra payoutDetail a miembros ACTIVE
```

#### Integration Tests (Backend)
```typescript
// integration/groups.test.ts
- [x] POST /groups - crea grupo correctamente
- [x] POST /groups - valida slots vs maxMembers (400)
- [x] GET /groups - retorna solo grupos OPEN por defecto
- [x] GET /groups - filtra por serviceId
- [x] GET /groups - paginación funciona
- [x] GET /groups/:id - oculta payoutDetail a extraños
- [x] GET /groups/:id - muestra payoutDetail a miembros
- [x] PATCH /groups/:id - solo owner puede editar (403)
- [x] POST /groups/:id/close - cierra y cancela cuotas
- [x] POST /groups/:id/close - falla con pagos pendientes (409)
```

#### Unit Tests (Mobile)
```typescript
// components/GroupCard.test.tsx
- [x] muestra nombre del servicio
- [x] muestra slots disponibles
- [x] muestra precio
- [x] accessibilityLabel descriptivo completo
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
- [x] `POST /groups/:id/join` - Solicitar unirse
- [x] `GET /groups/:id/members` - Listar miembros
- [x] `PATCH /memberships/:id/approve` - Aprobar (con firstAmount)
- [x] `PATCH /memberships/:id/reject` - Rechazar
- [x] `POST /memberships/:id/confirm-access` - Confirmar acceso
- [x] `POST /memberships/:id/leave` - Salir del grupo
- [x] `POST /memberships/:id/remove` - Expulsar (owner)
- [x] Validación transaccional de cupos al aprobar
- [x] Crear primera cuota al confirmar acceso

#### Mobile
- [x] RTK Query endpoints (memberships)
- [x] Pantalla Members List
- [x] Pantalla Join Request (solicitar)
- [x] UI para aprobar/rechazar solicitudes
- [x] UI para confirmar acceso
- [x] Componente MemberCard

### Tests Requeridos

#### Unit Tests (Backend)
```typescript
// services/memberships.test.ts
- [x] joinGroup crea membresía PENDING
- [x] joinGroup falla si ya es miembro
- [x] joinGroup falla si grupo FULL
- [x] approveMembership valida cupos en transacción
- [x] approveMembership guarda firstAmount
- [x] confirmAccess cambia a ACTIVE
- [x] confirmAccess crea primera cuota
- [x] confirmAccess falla si no está APPROVED
- [x] removeMember falla si < 2 cuotas OVERDUE
- [x] leaveMembership establece leavesAt
```

#### Integration Tests (Backend)
```typescript
// integration/memberships.test.ts
- [x] POST /groups/:id/join - crea solicitud
- [x] POST /groups/:id/join - falla si ya miembro (409)
- [x] POST /groups/:id/join - falla si grupo full (409)
- [x] PATCH /memberships/:id/approve - valida cupos concurrentes
- [x] PATCH /memberships/:id/approve - solo owner (403)
- [x] PATCH /memberships/:id/approve - guarda firstAmount
- [x] POST /memberships/:id/confirm-access - crea cuota
- [x] POST /memberships/:id/confirm-access - solo el miembro (403)
- [x] POST /memberships/:id/remove - requiere 2 OVERDUE (409)
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
- [x] `GET /me/payments` - Mis cuotas
- [x] `GET /groups/:id/payments` - Cuotas del grupo (owner)
- [x] `GET /payments/:id` - Detalle de cuota
- [x] `POST /payments/:id/mark-paid` - Marcar como pagado
- [x] `POST /payments/:id/confirm` - Confirmar pago (owner)
- [x] `POST /payments/:id/reject` - Rechazar con motivo
- [x] Validar transiciones de estado válidas

#### Mobile
- [x] RTK Query endpoints (payments)
- [x] Pantalla Payment Detail
- [x] Pantalla Mark as Paid
- [x] UI para confirmar/rechazar pagos
- [x] Lista de pagos en grupo

### Tests Requeridos

#### Unit Tests (Backend)
```typescript
// services/payments.test.ts
- [x] markAsPaid cambia PENDING → MARKED_PAID
- [x] markAsPaid permite OVERDUE → MARKED_PAID
- [x] markAsPaid falla desde CONFIRMED
- [x] markAsPaid guarda referencia y fecha
- [x] confirmPayment cambia MARKED_PAID → CONFIRMED
- [x] confirmPayment falla desde PENDING
- [x] rejectPayment cambia MARKED_PAID → PENDING
- [x] rejectPayment guarda motivo y limpia markedPaidAt
- [x] rejectPayment falla sin motivo
```

#### Integration Tests (Backend)
```typescript
// integration/payments.test.ts
- [x] GET /me/payments - retorna solo mis cuotas
- [x] GET /groups/:id/payments - solo owner ve todas
- [x] POST /payments/:id/mark-paid - cambia estado
- [x] POST /payments/:id/mark-paid - permite desde OVERDUE
- [x] POST /payments/:id/confirm - solo owner (403)
- [x] POST /payments/:id/confirm - transición inválida (409)
- [x] POST /payments/:id/reject - requiere motivo (400)
- [x] POST /payments/:id/reject - limpia markedPaidAt
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
- [x] Job: generatePaymentCycles (generar cuotas mensuales)
- [x] Job: markOverdue (marcar atrasos)
- [x] Job: sendReminders (enviar recordatorios)
- [x] `POST /me/push-token` - Registrar token
- [x] `GET /me/notifications` - Listar notificaciones
- [x] `PATCH /notifications/:id/read` - Marcar leída
- [x] `POST /me/notifications/read-all` - Marcar todas leídas
- [x] Script CLI: `npm run jobs:run -- --date=YYYY-MM-DD`
- [x] Ejecutar jobs al iniciar el servidor

#### Mobile
- [x] Configurar Expo Notifications
- [x] Registrar push token al login
- [x] Eliminar push token al logout
- [x] Pantalla Notifications
- [x] Handler de notificaciones en foreground
- [x] Invalidar RTK Query tags al recibir push

### Tests Requeridos

#### Unit Tests (Backend)
```typescript
// jobs/generatePayments.test.ts
- [x] genera cuotas para membresías ACTIVE
- [x] ignora grupos CLOSED
- [x] ignora membresías LEFT/REMOVED
- [x] es idempotente (no duplica)
- [x] usa timezone America/Bogota

// jobs/markOverdue.test.ts
- [x] marca OVERDUE después de 3 días de gracia
- [x] no marca dentro de días de gracia
- [x] ignora cuotas MARKED_PAID
- [x] ignora membresías no ACTIVE
- [x] guarda overdueAt

// jobs/sendReminders.test.ts
- [x] envía recordatorio 2 días antes
- [x] envía recordatorio día del vencimiento
- [x] envía notificación al marcar OVERDUE
- [x] no duplica notificaciones (unique constraint)
- [x] elimina push tokens inválidos
```

#### Integration Tests (Backend)
```typescript
// integration/notifications.test.ts
- [x] POST /me/push-token - registra token
- [x] POST /me/push-token - reasigna si ya existe
- [x] GET /me/notifications - lista paginada
- [x] PATCH /notifications/:id/read - marca leída
- [x] POST /me/notifications/read-all - marca todas
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
- [x] `POST /ratings` - Calificar usuario
- [x] `GET /users/:id/ratings` - Ver calificaciones de usuario
- [x] `POST /reports` - Reportar usuario
- [x] `GET /reports` - Listar reportes (solo admin)
- [x] `PATCH /reports/:id` - Actualizar estado de reporte
- [x] Validar elegibilidad para calificar

#### Mobile
- [x] Pantalla Rate User
- [x] Pantalla User Profile (con rating)
- [x] Componente AppRating (estrellas)
- [x] UI para reportar usuario

### Tests Requeridos

#### Unit Tests (Backend)
```typescript
// services/ratings.test.ts
- [x] createRating valida elegibilidad (cuota CONFIRMED o LEFT)
- [x] createRating falla si ya calificó
- [x] createRating valida score 1-5
- [x] getUserRatings calcula promedio

// services/reports.test.ts
- [x] createReport requiere motivo
- [x] getReports solo admin puede acceder
- [x] updateReport cambia estado
```

#### Integration Tests (Backend)
```typescript
// integration/ratings.test.ts
- [x] POST /ratings - crea calificación
- [x] POST /ratings - falla si no elegible (403)
- [x] POST /ratings - falla si ya calificó (409)
- [x] GET /users/:id/ratings - retorna promedio y lista

// integration/reports.test.ts
- [x] POST /reports - crea reporte
- [x] GET /reports - solo admin (403)
- [x] PATCH /reports/:id - actualiza estado
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
- [x] Pantalla Profile completa (settings, logout)
- [x] Navegación completa con tabs
- [x] Estados de carga y error en todas las pantallas
- [x] Empty states en listas vacías
- [x] Pull to refresh en listas
- [x] Feedback háptico en acciones importantes
- [x] Alto contraste toggle funcional
- [x] Deep linking básico

#### Backend
- [x] Seed completo para demo
- [x] Documentación OpenAPI actualizada
- [x] Script de reset de BD para demo

#### General
- [x] README con instrucciones completas
- [x] Verificar accesibilidad en todas las pantallas
- [x] Fix de bugs encontrados

### Tests Requeridos

#### Tests de pantallas (Mobile)
```typescript
// screens/Login.test.tsx
- [x] renderiza formulario completo
- [x] valida campos requeridos
- [x] navega a register
- [x] muestra error de credenciales

// screens/Home.test.tsx
- [x] muestra grupos del usuario
- [x] muestra empty state si no hay grupos
- [x] navega a crear grupo

// Similar para cada pantalla... (cubiertas en __tests__/*-screens.test.tsx y profile-screen.test.tsx)
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

<!-- Decision: 2026-11-12 -->
**Proceso.** Cada decisión relevante se documenta en esta sección y los checkboxes de cada fase se marcan `[x]` al completarse. Docker se usa solo por CLI (Colima), sin Docker Desktop; `docker-compose.yml` aún no fue probado.

<!-- Decision: 2026-11-12 -->
**Docker verificado.** Con Colima + `docker-compose` (binario con guion; el plugin `docker compose` no queda registrado con la instalación de brew), `docker-compose up --build` levanta la API y PostgreSQL, aplica migraciones y `/health` responde. Un script `backend/docker/init-test-db.sql` crea la BD `cuotix_test` al inicializar el volumen, de modo que los tests usan el contenedor y ya no se requiere PostgreSQL local.

<!-- Decision: 2026-11-12 -->
**Auth: refresh tokens (Fase 1).** El refresh token es un JWT firmado con `JWT_REFRESH_SECRET` y `jti` único; en BD solo se guarda su hash SHA-256. Un token con firma válida pero sin registro en BD (ya rotado/revocado) se interpreta como reutilización: se revocan todos los tokens del usuario y se responde `auth/token-revoked`. La rotación consume el token con `deleteMany` (atómico) para que dos peticiones concurrentes no lo usen a la vez.

<!-- Decision: 2026-11-12 -->
**Auth: formato de errores y códigos.** Todas las respuestas de error son `{ "error": { "code", "message", "details"? } }` con los códigos de `IMPLEMENTATION_SPEC.md` B.15 (`backend/src/lib/errors.ts`). `auth/token-invalid` se usa también para "sin token / token mal formado" en el middleware.

<!-- Decision: 2026-11-12 -->
**Auth: `POST /auth/logout`.** Requiere access token válido (Bearer) además del `refreshToken`. `pushToken` es **opcional** (la spec lo marca obligatorio, pero el registro de push tokens llega en una fase posterior); si se envía, se elimina. Responde `204`.

<!-- Decision: 2026-11-12 -->
**Auth: validación y respuestas.** Correo normalizado a minúsculas; contraseña 8–128 caracteres; nombre 2–80; teléfono opcional 7–20. `register` y `login` retornan `{ user, accessToken, refreshToken }` (sin `passwordHash`). `login` ejecuta una verificación Argon2 ficticia cuando el correo no existe para no filtrar usuarios por tiempo de respuesta. `PATCH /me` solo permite `name` y `phone`; el resto de campos se ignora.

<!-- Decision: 2026-11-12 -->
**Auth: rate limiting.** `express-rate-limit` con límites de B.16 (login 5/15 min por IP+correo, register 10/h, refresh 10/min), configurables con `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_REGISTER_MAX` y `RATE_LIMIT_REFRESH_MAX`. Se desactiva con `NODE_ENV=test` salvo `createApp({ forceRateLimit: true })` (usado por su test). El limitador general de 100/min por usuario queda para una fase posterior. `trust proxy` solo se activa con la variable `TRUST_PROXY` para no permitir suplantar la IP vía `X-Forwarded-For`.

<!-- Decision: 2026-11-12 -->
**Mobile: sesión.** El access token vive solo en memoria (Redux) y el refresh token en `expo-secure-store`. Al abrir la app, `restoreSession` rota el refresh token guardado y carga `/me`; mientras tanto se mantiene el splash (`status: 'loading'`). El interceptor (`baseQueryWithReauth`) reintenta una vez ante un 401 y comparte una sola renovación entre peticiones simultáneas; si el servidor rechaza el refresh, cierra la sesión, y si no hay red conserva el token guardado. Las rutas se reorganizaron en grupos `(auth)` (login/register) y `(app)` (tabs existentes) protegidos con `Stack.Protected`. Los componentes de formulario de `src/components/auth/` fueron provisionales y los reemplazó la Fase 2.

<!-- Decision: 2026-11-12 -->
**UI: tema (Fase 2).** Los tokens viven en `src/theme/` (`colors`, `typography`, `spacing`) con la paleta de `UI_ACCESSIBILITY_SPEC.md`. Como `AppColors` es semántico (`background`, `surface`, `border`, `text`, `primary`, `error`, `payment.*`…), no se exponen las escalas completas 50–900. Los colores de texto secundario, borde y error se oscurecieron respecto a la escala base para cumplir ≥4.5:1 (texto) y se añadieron variantes de alto contraste. `ThemeProvider` (`src/theme/theme-provider.tsx`) resuelve tema (sistema/claro/oscuro) y alto contraste desde `settingsSlice`, y `src/hooks/use-theme.ts` pasó a ser un adaptador sobre ese tema para que `ThemedText`/`ThemedView` de la plantilla sigan coherentes. El layout raíz alimenta también el tema de React Navigation.

<!-- Decision: 2026-11-12 -->
**UI: iconos y háptica.** No se añadieron dependencias: `AppIcon` usa `expo-symbols` (SF Symbols en iOS) con un glifo de texto de respaldo en Android/web, y es decorativo (oculto a lectores de pantalla) salvo que reciba `accessibilityLabel`. La preferencia `haptics` existe en `settingsSlice`, pero el feedback háptico de `AppButton` queda pendiente hasta incorporar `expo-haptics`. `settingsSlice` no se persiste todavía (se hará con la pantalla de perfil).

<!-- Decision: 2026-11-12 -->
**UI: detalles de componentes.** `AppText` asigna `accessibilityRole="header"` por defecto a h1–h3. `AppModal` oculta el fondo táctil a los lectores de pantalla (el botón "Cerrar" del encabezado es el control accesible) para no duplicar el botón. `AppScreen` acepta `centered` para formularios de acceso. Los componentes se exportan desde `@/components/ui`.

<!-- Decision: 2026-11-12 -->
**Grupos: respuestas y permisos (Fase 3).** Todos los endpoints de `/services` y `/groups` requieren Bearer. Las respuestas usan `{ group }`, `{ service }` o `{ data, pagination }`. Los listados nunca incluyen `payoutDetail`; el detalle lo incluye solo al owner y a membresías `APPROVED`/`ACTIVE` (A.7) y agrega `isOwner`, `myMembership` (`{ id, status }` o `null`), `occupiedSlots` y `availableSlots` (cupos − membresías `APPROVED`/`ACTIVE`). Un id que no es UUID responde `404 general/not-found`.

<!-- Decision: 2026-11-12 -->
**Grupos: validación.** `slots` entre 1 y `service.maxMembers − 1` (400 `validation/error` con `details[].field = "slots"`); `paymentDay` 1–28 para que exista en todos los meses; precio entero positivo (COP); título 3–80, descripción ≤500. `PATCH /groups/:id` solo acepta campos de contenido y `status` `OPEN`/`PAUSED` (no se puede cambiar `ownerId`, `serviceId` ni cerrar por esa vía), no permite bajar `slots` por debajo de los ocupados (409 `group/slots-exceeded`) y rechaza grupos `CLOSED` (409 `group/closed`). Los estados `FULL` y su transición automática llegan con las membresías (Fase 4).

<!-- Decision: 2026-11-12 -->
**Grupos: listado y cierre.** `GET /groups` suma el parámetro `mine=true` (grupos donde soy owner o tengo membresía `PENDING`/`APPROVED`/`ACTIVE`) para la pantalla Home; con `mine` no se aplica el filtro por defecto `status=OPEN`. Orden por `createdAt` descendente. `POST /groups/:id/close` es transaccional: falla con 409 `group/has-pending-payments` si hay cuotas `MARKED_PAID`; si no, pasa las `PENDING`/`OVERDUE` a `CANCELLED` y el grupo a `CLOSED`. Los tests limpian también la tabla `Service` entre casos; el seed (`npm run db:seed` / `prisma db seed`) es idempotente (upsert por nombre) y solo carga los 3 servicios.

<!-- Decision: 2026-11-12 -->
**Mobile: rutas y paginación (Fase 3).** `(app)` es ahora un Stack con `(tabs)` (Mis grupos / Explorar) y las pantallas `groups/create` y `groups/[id]` encima, con el encabezado nativo para volver. Explorar pagina pidiendo `limit = 20 × páginas` (tope 100) con el botón "Ver más grupos" en vez de fusionar páginas en la caché de RTK Query, para evitar duplicados al invalidar etiquetas. Se añadieron `AppChip`, `AppDivider`, `AppEmptyState` y `AppList` a `src/components/ui`. El botón de unirse al grupo y la lista de miembros se implementan en la Fase 4; el cierre de sesión quedó al final de Mis grupos hasta que exista la pantalla de perfil.

<!-- Decision: 2026-11-12 -->
**Membresías: solicitud y permisos (Fase 4).** `POST /groups/:id/join` responde `201 { membership }`. Un grupo `FULL` (o sin cupos libres) responde `group/full`; `PAUSED`/`CLOSED` responde `group/closed`; el owner no puede unirse (`general/forbidden`). Como la spec bloquea toda membresía previa salvo `REJECTED`, quien salió (`LEFT`) o fue expulsado (`REMOVED`) no puede volver a solicitar (`group/already-member`); una solicitud `REJECTED` se reutiliza y vuelve a `PENDING`. `GET /groups/:id/members` responde `{ data }`: el owner ve `PENDING`/`APPROVED`/`ACTIVE` (con `firstAmount`); un miembro `APPROVED`/`ACTIVE` solo ve a los `ACTIVE`; el resto recibe 403. Se agregaron los códigos `group/already-member`, `membership/not-found`, `membership/invalid-transition` y `membership/not-eligible-removal`.

<!-- Decision: 2026-11-12 -->
**Membresías: cupos y estado `FULL`.** Aprobar bloquea la fila del grupo (`SELECT … FOR UPDATE`) dentro de la transacción para que aprobaciones simultáneas no sobrepasen `slots`, y marca el grupo `FULL` al ocupar el último cupo. Salir o ser expulsado reabre un grupo `FULL` en el acto (el estado pasa a `LEFT`/`REMOVED` de inmediato; `leavesAt` solo informa hasta cuándo rige el ciclo). Todas las transiciones usan `updateMany` condicionado al estado esperado, de modo que una doble petición simultánea solo se aplica una vez. No se puede aprobar en un grupo `CLOSED`.

<!-- Decision: 2026-11-12 -->
**Membresías: primera cuota y fechas.** `confirm-access` crea la cuota del mes actual si el día de pago (hora de Bogotá, UTC-5 fijo) aún no pasó, o del mes siguiente si ya pasó; `dueDate` es el `paymentDay` a las 00:00 de Bogotá (`backend/src/lib/dates.ts`). `leavesAt` es el próximo día de pago estrictamente posterior a hoy; al salir se cancelan las cuotas `PENDING` con vencimiento en `leavesAt` o después (las `OVERDUE`/`MARKED_PAID` se conservan para que el administrador pueda cobrarlas o confirmarlas). Quien aún no ha pagado su primera cuota y sale antes de ese día de pago la ve cancelada.

<!-- Decision: 2026-11-12 -->
**Membresías: expulsión y notificaciones.** "Consecutivas" se interpreta como dos cuotas `OVERDUE` contiguas en el historial no cancelado (ordenado por `dueDate`); una cuota pagada en medio reinicia la cuenta. Las notificaciones de la fase (`JOIN_REQUEST`, `MEMBERSHIP_APPROVED`, `MEMBERSHIP_REJECTED`, `ACCESS_CONFIRMED`, `MEMBER_REMOVED`) se guardan en la tabla `Notification` (`services/notifications.ts`); el envío push y el endpoint de lectura llegan con la Fase 6. `leave` no emite notificación al owner (no está en la spec).

<!-- Decision: 2026-11-12 -->
**Mobile: membresías (Fase 4).** El detalle del grupo pasó a `groups/[id]/index.tsx` para alojar `groups/[id]/join` (pantalla de solicitud con resumen y confirmación) y `groups/[id]/members` (solicitudes, esperando acceso y activos). Aprobar abre un modal con monto opcional de primera cuota; expulsar abre un modal con motivo opcional y muestra el error del servidor si aún no es elegible. Salir del grupo pide confirmación. `MemberCard` deja los botones fuera de la tarjeta (un `AppCard` es un único elemento accesible y ocultaría sus botones a los lectores de pantalla). Se añadió `AppAvatar` (decorativo) a `src/components/ui`.

<!-- Decision: 2026-11-12 -->
**Pagos: permisos y transiciones (Fase 5).** `mark-paid` solo lo hace el dueño de la cuota (`general/forbidden` si no); `confirm` y `reject` solo el administrador del grupo (`group/not-owner`). Un id que no es UUID responde `404 payment/not-found`. Desde `CONFIRMED` cualquier acción responde `payment/already-confirmed`; desde cualquier otro estado no permitido, `payment/invalid-transition` (ambos 409). `mark-paid` acepta `PENDING` y `OVERDUE` (pago tardío) y limpia un `rejectionReason` previo; todas las transiciones usan `updateMany` condicionado al estado esperado, así una doble petición solo se aplica una vez (y solo genera una notificación).

<!-- Decision: 2026-11-12 -->
**Pagos: validación y respuestas.** `reference` opcional, 1–100 caracteres; `reason` de `reject` obligatorio, 10–200. `GET /me/payments` y `GET /groups/:id/payments` responden `{ data }` (máx. 200, `dueDate` descendente, filtro opcional `?status=`) con `group` (título, medio de pago, servicio) y `member`, sin `payoutDetail`. `GET /payments/:id` responde `{ payment }` e incluye `payoutDetail` solo al pagador y al administrador (aunque el pagador ya haya salido del grupo, porque aún puede deber la cuota). Notificaciones: `PAYMENT_MARKED_PAID` al administrador, `PAYMENT_CONFIRMED`/`PAYMENT_REJECTED` al miembro, vía `notify()`; el push llega con la Fase 6.

<!-- Decision: 2026-11-12 -->
**Mobile: pagos (Fase 5).** Rutas nuevas: `payments/index` (Mis cuotas, accesible desde Mis grupos), `payments/[id]` (detalle; según si el usuario es el pagador o el administrador muestra "Ya pagué" o "Confirmar/Rechazar"), `payments/mark-paid` (referencia opcional) y `groups/[id]/payments` (el administrador ve las cuotas de todos; un miembro, las suyas en ese grupo). El rechazo pide un motivo de al menos 10 caracteres en un modal. Fechas de vencimiento se muestran en horario de Bogotá (`src/lib/payments.ts`).

<!-- Decision: 2026-11-12 -->
**Jobs y notificaciones (Fase 6).** Los jobs viven en `backend/src/jobs/` (`generatePayments`, `markOverdue`, `sendReminders`) y reutilizan `lib/dates.ts` (Bogotá, con `currentPeriod`, `bogotaDayStart` y `daysUntil` nuevos). `generatePaymentCycles` crea la cuota del mes siguiente (spec C.3); `markOverdue` usa 3 días de gracia; el CLI `npm run jobs:run -- --date=YYYY-MM-DD` simula esa fecha a mediodía de Bogotá. Al arrancar el servidor se programan los crons (00:05, 00:10 y 09:00 Bogotá) y se ejecutan los tres jobs una vez; un fallo se registra y no tumba el servidor.

<!-- Decision: 2026-11-12 -->
**Recordatorios: un solo `PAYMENT_REMINDER` por cuota.** El `@@unique([userId, type, paymentId])` impide dos recordatorios del mismo tipo para la misma cuota, y cambiar el esquema (nuevo valor del enum) queda fuera de lo que se decide de forma autónoma. Por eso se envía uno solo: el primero que corra entre "2 días antes" y "el día del vencimiento" (si el servidor estuvo apagado hace 2 días, el del día de vencimiento hace de respaldo). Para tener ambos haría falta un tipo nuevo (p. ej. `PAYMENT_DUE_TODAY`). El aviso de atraso (`PAYMENT_OVERDUE`) se envía desde `sendReminders` a toda cuota `OVERDUE` de una membresía activa, de modo que también cubre atrasos marcados mientras el servidor estaba apagado.

<!-- Decision: 2026-11-12 -->
**Push.** `notify()` guarda la notificación y dispara el push sin esperarlo (se usa dentro de transacciones); `notifyOnce()` es la variante idempotente de los jobs (captura `P2002`, espera el push). `sendPush` nunca lanza: un fallo no aborta el lote y los tokens con `DeviceNotRegistered` se eliminan. El envío usa la API HTTP de Expo (`EXPO_ACCESS_TOKEN` opcional) y en `NODE_ENV=test` no sale a la red (se inyecta con `setPushSender`). Los pushes llevan `type`, `notificationId` y los ids del recurso en `data`.

<!-- Decision: 2026-11-12 -->
**API de notificaciones.** `POST /me/push-token` responde 204 (upsert por token, reasigna el usuario). `GET /me/notifications?page&limit` (límite 20 por defecto, máx. 50) responde `{ data, page, limit, total, unread }`. `PATCH /notifications/:id/read` responde `{ notification }` y da 404 si el id no existe, no es UUID o es de otro usuario. `POST /me/notifications/read-all` responde `{ updated }`. El logout ya borraba el push token (Fase 1).

<!-- Decision: 2026-11-12 -->
**Mobile: notificaciones (Fase 6).** La bandeja es la pantalla `notifications/index` accesible desde "Notificaciones (n)" en Mis grupos (igual que "Mis cuotas"), en vez de una pestaña, porque las pestañas nativas requieren un icono PNG nuevo. El token se registra tras iniciar o restaurar sesión (no bloquea ni rompe el acceso si se deniega el permiso, es simulador o falla la red) y se envía en el logout. En primer plano se muestra el banner y `useNotificationListeners` invalida las etiquetas RTK Query según el tipo (`tagsForNotification`); al tocar un push se abre la cuota, el grupo o la bandeja. En desarrollo hace falta un build de desarrollo (no Expo Go) y un `projectId` de EAS para obtener el token.

<!-- Decision: 2026-11-12 -->
**Calificaciones: elegibilidad y respuestas (Fase 7).** Solo se califican entre sí el administrador y un miembro del mismo grupo (no entre miembros). Es elegible si el miembro tiene al menos una cuota `CONFIRMED` o su membresía está `LEFT`; en cualquier otro caso (incluido calificarse a uno mismo o ser ajeno al grupo) responde `403 rating/not-eligible`. `POST /ratings` recibe `{ groupId, toId, score (entero 1–5), comment? (≤300) }` y responde `201 { rating }`; el `@@unique([groupId, fromId, toId])` garantiza `409 rating/already-rated` también ante peticiones simultáneas (se captura `P2002`). `GET /users/:id/ratings?page&limit` responde `{ user, average (1 decimal, null sin calificaciones), count, data, page, limit }`; un id inválido o inexistente da 404.

<!-- Decision: 2026-11-12 -->
**Reportes y moderación (Fase 7).** `POST /reports` recibe `{ groupId, reportedId, reason (3–100), detail? (≤500) }`; ambos usuarios deben haber compartido el grupo (administrador o membresía `APPROVED`/`ACTIVE`/`LEFT`/`REMOVED`), no se puede reportar a uno mismo (`403 general/forbidden`). `GET /reports?status=` y `PATCH /reports/:id { status }` exigen `role = ADMIN` (`403 general/forbidden`), se verifica en el servicio contra la BD y no en el JWT. El panel de moderación es solo API en este MVP: la app móvil no tiene pantalla de admin (los hooks `useListReportsQuery`/`useUpdateReportMutation` ya existen en `ratingsApi`). No se envían notificaciones por calificaciones ni reportes (no hay tipos en el enum y cambiarlo queda fuera de lo decidible de forma autónoma).

<!-- Decision: 2026-11-12 -->
**Mobile: calificaciones y reportes (Fase 7).** Nuevo `AppRating` en `src/components/ui`: editable (cinco `radio` de ≥48dp con etiqueta "N estrellas") o solo lectura (un único elemento "Calificación: X de 5 estrellas"); las estrellas llenas/vacías se distinguen por glifo (★/☆), no solo por color. Rutas: `users/[id]` (perfil con promedio y lista; con `groupId` ofrece "Calificar" y "Reportar usuario"), `ratings/create` y `reports/create` (motivo con `AppChip` + detalle opcional). Se llega al perfil desde "Ver perfil" en la lista de miembros y desde "Perfil de {administrador}" en el detalle del grupo (miembros activos o que salieron). La elegibilidad la decide el servidor y su mensaje se muestra en pantalla.

<!-- Decision: 2026-11-12 -->
**Mobile: tabs y Perfil (Fase 8).** Cuatro pestañas (Inicio, Explorar, Notificaciones, Perfil, como en la spec §8.4). Los iconos nativos usan `sf` (iOS) y `md` (Android) en vez de PNG nuevos, y la pestaña de notificaciones muestra el contador de no leídas. La bandeja pasó de `notifications/index` a `(tabs)/notifications` (la URL `/notifications` no cambia, así que los pushes y enlaces siguen funcionando). Inicio conserva "Crear grupo" y "Mis cuotas"; "Notificaciones" y "Cerrar sesión" salieron de ahí y viven en las pestañas/Perfil. En Perfil: tema (Sistema/Claro/Oscuro con `AppChip`), alto contraste y vibración (nuevo `AppSwitch`), editar nombre/teléfono, acceso a mis calificaciones y cuotas, y cierre de sesión. No se implementaron "Métodos de cobro" ni "Cambiar contraseña" (no hay endpoints) ni `reduceMotion` (no hay animaciones propias que reducir).

<!-- Decision: 2026-11-12 -->
**Ajustes persistentes y háptica (Fase 8).** `settingsSlice` se guarda como JSON en `expo-secure-store` (`cuotix.settings`; no es sensible, pero evita añadir AsyncStorage). `loadSettings` valida cada campo y ignora lo inválido; la persistencia se activa después de cargar para no pisar lo guardado. Se añadió `expo-haptics` (módulo de Expo): `AppButton` vibra suave al presionar (salvo `ghost`), `AppSwitch` hace feedback de selección y los flujos de pagar/confirmar/rechazar, calificar, crear grupo y solicitar unirse vibran con éxito o error. `ThemeProvider` sincroniza la preferencia `haptics` con `lib/haptics`, que también traga cualquier fallo del motor háptico.

<!-- Decision: 2026-11-12 -->
**Estados, refresh y deep linking (Fase 8).** Las listas ya tenían carga/error/vacío/refresh; `AppScreen` ahora acepta `refreshing`/`onRefresh` (pull to refresh en pantallas `scrollable`) y lo usan detalle de grupo, miembros, perfil de usuario y detalle de cuota. El esquema `cuotix://` ya estaba en `app.json`; se añadió `anchor: '(tabs)'` en `(app)` para que un enlace profundo quede sobre las pestañas, y `+not-found` para rutas desconocidas. Un enlace sin sesión iniciada no recuerda el destino tras el login (fuera del alcance del MVP).

<!-- Decision: 2026-11-12 -->
**Panel de moderación fuera de la app.** Se mantiene como API (`GET/PATCH /reports`, con el usuario `moderator@example.com` del seed); no hay pantalla de administrador en el MVP.

<!-- Decision: 2026-11-12 -->
**Demo y OpenAPI (Fase 8).** `backend/prisma/seed-demo.ts` (`npm run db:reset-demo`) vacía la BD y carga el catálogo más los usuarios de `IMPLEMENTATION_SPEC.md` E (`owner/member/member2/moderator@example.com`, `Test1234!`) y dos extra (solicitante y aprobado), 3 grupos y cuotas en todos los estados con fechas relativas a "hoy". Se niega a correr con `NODE_ENV=production`. La especificación OpenAPI 3.0 está escrita a mano en `docs/openapi.yaml` (sin dependencias nuevas); un test verifica que coincida con las rutas de Express en ambos sentidos, aunque no valida los esquemas de respuesta. La verificación de accesibilidad fue estructural (roles, etiquetas, tamaños táctiles y estados en tests); falta una pasada manual con VoiceOver/TalkBack en dispositivo.
