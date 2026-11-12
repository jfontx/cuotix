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
