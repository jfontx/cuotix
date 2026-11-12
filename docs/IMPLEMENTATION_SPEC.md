# Cuotix: Especificaciones de Implementación

> Decisiones técnicas detalladas para las secciones 2, 5, 6 y 7 del plan.
> Aprobado: 2026-11-12

---

## A. Modelo de Datos

### A.1 Enums

```prisma
enum GroupStatus      { OPEN FULL PAUSED CLOSED }
enum MembershipStatus { PENDING APPROVED ACTIVE REJECTED LEFT REMOVED }
enum PaymentStatus    { PENDING MARKED_PAID CONFIRMED OVERDUE CANCELLED }
enum ReportStatus     { OPEN REVIEWED DISMISSED }
enum Role             { USER ADMIN }

enum NotificationType {
  PAYMENT_REMINDER
  PAYMENT_OVERDUE
  PAYMENT_MARKED_PAID
  PAYMENT_CONFIRMED
  PAYMENT_REJECTED
  JOIN_REQUEST
  MEMBERSHIP_APPROVED
  MEMBERSHIP_REJECTED
  ACCESS_CONFIRMED
  GROUP_CLOSED
  MEMBER_REMOVED
}
```

**Convención de mapeo de estados:**

| DB (Prisma) | API Response | UI Component |
|-------------|--------------|--------------|
| `MARKED_PAID` | `"markedPaid"` | `'markedPaid'` |
| `PENDING` | `"pending"` | `'pending'` |
| etc. | camelCase | camelCase |

El backend transforma SCREAMING_SNAKE_CASE a camelCase en las respuestas JSON. El frontend siempre recibe y usa camelCase.

### A.2 Modelos nuevos

```prisma
model PushToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  platform  String   // "ios" | "android"
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique  // Hash del token, nunca en claro
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Notification {
  id         String           @id @default(uuid())
  userId     String
  type       NotificationType
  title      String
  body       String
  paymentId  String?          // Para deduplicación de notificaciones de pago
  data       Json?            // Metadata adicional (groupId, membershipId, etc.)
  read       Boolean          @default(false)
  sentAt     DateTime         @default(now())
  user       User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, type, paymentId])  // Deduplicación por constraint
}
```

### A.3 Campos adicionales en modelos existentes

```prisma
// En Membership:
leavesAt    DateTime?  // Fecha efectiva de salida (fin del ciclo)
firstAmount Int?       // Monto acordado de primera cuota (si difiere de pricePerMember)

// En PaymentCycle:
markedPaidAt    DateTime?  // Cuándo el miembro marcó como pagado
confirmedAt     DateTime?  // Cuándo el owner confirmó el pago
rejectionReason String?    // Motivo si el owner rechazó
overdueAt       DateTime?  // Cuándo pasó a OVERDUE
```

### A.4 Relación slots vs maxMembers

- `Service.maxMembers`: límite oficial del plan (ej: Spotify Familiar = 6 incluyendo al dueño).
- `Group.slots`: cuántos cupos ofrece el administrador.
- **Validación:** `slots <= service.maxMembers - 1` (el admin ocupa 1).

### A.5 Validación de cupos (transaccional)

```typescript
await prisma.$transaction(async (tx) => {
  const activeCount = await tx.membership.count({
    where: {
      groupId,
      status: { in: ['APPROVED', 'ACTIVE'] }
    }
  })

  if (activeCount >= group.slots) {
    throw new AppError('group/slots-exceeded', 'No hay cupos disponibles')
  }

  await tx.membership.update({
    where: { id: membershipId },
    data: { status: 'APPROVED' }
  })
})
```

### A.6 Cálculo de dueDate

`dueDate` = año/mes del `period` + `paymentDay` del grupo (timezone Bogotá).

Ejemplo: `period: "2026-11"` + `paymentDay: 15` → `2026-11-15T00:00:00-05:00`

### A.7 Protección de payoutDetail

- Almacenado en texto plano (no cifrado).
- Solo expuesto a: owner del grupo y membresías con estado `APPROVED` o `ACTIVE`.
- Nunca en listados públicos ni logs.
- Requiere test de autorización.

### A.8 Catálogo inicial (seed)

```typescript
const services = [
  {
    name: "Spotify Premium Familiar",
    planType: "familiar",
    maxMembers: 6,
    allowsOutOfHome: false,
    notes: "Todos deben residir en la misma dirección. Spotify puede verificar ubicación.",
    lastReviewedAt: new Date()
  },
  {
    name: "YouTube Premium Familiar",
    planType: "familiar",
    maxMembers: 6,
    allowsOutOfHome: false,
    notes: "Miembros deben ser del mismo hogar. Google puede verificar.",
    lastReviewedAt: new Date()
  },
  {
    name: "Netflix (Miembro Extra)",
    planType: "miembro_extra",
    maxMembers: 2,
    allowsOutOfHome: true,
    notes: "El miembro extra puede estar en otra ubicación.",
    lastReviewedAt: new Date()
  }
]
```

### A.9 Seguridad y Autenticación

#### Hash de Passwords

Usar **Argon2id** (preferido) o **bcrypt** como fallback.

```typescript
// Argon2 (recomendado)
import argon2 from 'argon2'

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,  // 64 MB
    timeCost: 3,
    parallelism: 4,
  })
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password)
}
```

#### JWT (Access + Refresh Tokens)

| Token | Duración | Almacenamiento |
|-------|----------|----------------|
| Access Token | 15 minutos | Memoria (RTK Query) |
| Refresh Token | 7 días | expo-secure-store (móvil), BD (hash del lado servidor) |

```typescript
// Configuración JWT
const JWT_CONFIG = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  },
}
```

#### Rotación de Refresh Tokens

1. Cliente envía refresh token
2. Servidor verifica hash en BD
3. Si válido: elimina el viejo, genera nuevo, guarda hash del nuevo
4. Si token ya fue usado (no existe): **revocar TODOS los tokens del usuario** (posible robo)
5. Retorna nuevo access + refresh token

#### Variables de Entorno Requeridas

```env
# .env.example
DATABASE_URL=postgresql://user:pass@localhost:5432/cuotix
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
EXPO_ACCESS_TOKEN=your-expo-push-token
```

### A.10 Modelos Rating y Report (con relaciones)

Los modelos del plan original no tenían relaciones explícitas. Aquí están corregidos:

```prisma
model Rating {
  id        String   @id @default(uuid())
  groupId   String
  fromId    String
  toId      String
  score     Int      // 1-5
  comment   String?
  createdAt DateTime @default(now())

  // Relaciones
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  fromUser  User     @relation("RatingsGiven", fields: [fromId], references: [id], onDelete: Cascade)
  toUser    User     @relation("RatingsReceived", fields: [toId], references: [id], onDelete: Cascade)

  @@unique([groupId, fromId, toId])
}

model Report {
  id         String       @id @default(uuid())
  groupId    String
  reporterId String
  reportedId String
  reason     String
  detail     String?
  status     ReportStatus @default(OPEN)
  createdAt  DateTime     @default(now())

  // Relaciones
  group      Group        @relation(fields: [groupId], references: [id], onDelete: Cascade)
  reporter   User         @relation("ReportsCreated", fields: [reporterId], references: [id], onDelete: Cascade)
  reported   User         @relation("ReportsReceived", fields: [reportedId], references: [id], onDelete: Cascade)
}

// Agregar en model User:
// ratingsGiven     Rating[]  @relation("RatingsGiven")
// ratingsReceived  Rating[]  @relation("RatingsReceived")
// reportsCreated   Report[]  @relation("ReportsCreated")
// reportsReceived  Report[]  @relation("ReportsReceived")

// Agregar en model Group:
// ratings    Rating[]
// reports    Report[]
```

---

## B. API

### B.1 `POST /groups/:id/join`

**Request:** Body vacío

**Lógica:**
1. Verificar grupo existe y estado es `OPEN`
2. Verificar usuario no es owner del grupo
3. Verificar usuario no tiene membresía existente (cualquier estado excepto `REJECTED`)
4. Crear membresía con estado `PENDING`
5. Notificar al owner (tipo `JOIN_REQUEST`)

**Errores:**
- `group/closed` si estado no es `OPEN`
- `group/already-member` si ya tiene membresía

### B.2 `PATCH /memberships/:id/approve`

**Request:**
```json
{
  "firstAmount": 8000  // Opcional, default = group.pricePerMember
}
```

**Lógica:**
1. Validar usuario es owner del grupo
2. Validar estado actual = `PENDING`
3. En transacción: verificar cupos (APPROVED + ACTIVE < slots) y actualizar a `APPROVED`
4. Guardar `firstAmount` en la membresía
5. Notificar al miembro (tipo `MEMBERSHIP_APPROVED`)

**Errores:**
- `group/not-owner` si no es owner
- `group/slots-exceeded` si no hay cupos
- `membership/invalid-transition` si estado no es PENDING

### B.3 `PATCH /memberships/:id/reject`

**Request:** Body vacío

**Lógica:**
1. Validar usuario es owner del grupo
2. Validar estado actual = `PENDING`
3. Cambiar estado a `REJECTED`
4. Notificar al miembro (tipo `MEMBERSHIP_REJECTED`)

### B.4 `POST /memberships/:id/confirm-access`

**Request:** Body vacío

**Lógica:**
1. Verificar usuario es dueño de la membresía
2. Verificar estado = `APPROVED`
3. Cambiar a `ACTIVE`, establecer `joinedAt = now()`
4. Generar primera cuota:
   - `amount`: `membership.firstAmount ?? group.pricePerMember`
   - `period`: mes actual o siguiente según `paymentDay`
   - `dueDate`: próximo `paymentDay` (timezone Bogotá)
5. Notificar al admin (tipo `ACCESS_CONFIRMED`)

### B.5 `POST /memberships/:id/leave`

**Request:** Body vacío

**Lógica:**
1. Verificar usuario es dueño de la membresía
2. Verificar estado es `APPROVED` o `ACTIVE`
3. Establecer `leavesAt` al final del ciclo actual
4. Cambiar estado a `LEFT`
5. Cancelar cuotas `PENDING` futuras (no la del ciclo actual)
6. El grupo vuelve a `OPEN` si estaba `FULL`

**Nota:** La salida es efectiva al final del ciclo. El miembro puede seguir usando el servicio hasta entonces.

### B.6 `POST /memberships/:id/remove`

**Request:**
```json
{
  "reason": "Motivo de expulsión"  // Opcional
}
```

**Lógica:**
1. Verificar usuario es owner del grupo
2. Verificar membresía está `ACTIVE`
3. Verificar elegibilidad: al menos 2 cuotas `OVERDUE` consecutivas
4. Cambiar estado a `REMOVED`
5. Cancelar cuotas `PENDING`/`OVERDUE`
6. El grupo vuelve a `OPEN` si estaba `FULL`
7. Notificar al miembro (tipo `MEMBER_REMOVED`)

**Errores:**
- `membership/not-eligible-removal` si no tiene 2 cuotas OVERDUE

### B.7 `POST /payments/:id/reject`

**Request:**
```json
{
  "reason": "No encontré la transferencia con esa referencia"  // Obligatorio, mín 10 chars
}
```

**Lógica:**
1. Verificar estado = `MARKED_PAID`
2. Cambiar a `PENDING`
3. Guardar `rejectionReason`, limpiar `markedPaidAt`
4. Notificar al miembro (tipo `PAYMENT_REJECTED`)

**Transición adicional válida:** `OVERDUE` → `MARKED_PAID` (pago tardío)

### B.8 `POST /groups/:id/close`

**Request:** Body vacío

**Validación:** No permitir si hay cuotas en estado `MARKED_PAID`

**Lógica:**
1. Verificar usuario es owner
2. Verificar no hay cuotas `MARKED_PAID` pendientes
3. Grupo → `CLOSED`
4. Membresías `PENDING` → `REJECTED`
5. Membresías `APPROVED`/`ACTIVE` → `LEFT` (motivo: grupo cerrado)
6. Cuotas `PENDING`/`OVERDUE` de esas membresías → `CANCELLED`
7. Notificar a todos (tipo `GROUP_CLOSED`)

### B.9 `POST /auth/logout`

**Request:**
```json
{
  "refreshToken": "...",
  "pushToken": "ExponentPushToken[xxx]"  // Obligatorio
}
```

**Lógica:**
1. Eliminar `RefreshToken` de la BD (por hash)
2. Eliminar `PushToken` del usuario actual
3. En la app: llamar `api.util.resetApiState()` para limpiar caché

### B.10 `POST /auth/refresh`

**Request:**
```json
{
  "refreshToken": "..."
}
```

**Lógica (rotación):**
1. Buscar por hash del token
2. Si no existe o expiró → error `TOKEN_INVALID`
3. Si el token ya fue usado (no existe pero el hash coincide con uno revocado):
   - Revocar TODOS los refresh tokens del usuario (posible robo)
   - Error `TOKEN_REVOKED`
4. Eliminar el token viejo
5. Crear nuevo refresh token, guardar hash
6. Retornar nuevo access token + nuevo refresh token

### B.11 `POST /me/push-token`

**Request:**
```json
{
  "token": "ExponentPushToken[xxx]",
  "platform": "ios"
}
```

**Lógica:** Upsert por `token`, reasignando `userId` al usuario actual.

### B.12 Endpoints de notificaciones

| Endpoint | Descripción |
|----------|-------------|
| `GET /me/notifications` | Lista paginada, ordenada por fecha desc |
| `PATCH /notifications/:id/read` | Marca como leída |
| `POST /me/notifications/read-all` | Marca todas como leídas |

### B.13 Filtros en `GET /groups`

| Param | Descripción |
|-------|-------------|
| `serviceId` | Filtrar por servicio |
| `status` | Default `OPEN` (solo grupos a los que se puede unir) |
| `minPrice` / `maxPrice` | Rango de precio |
| `search` | Búsqueda en título/descripción |
| `excludeMine` | Excluir donde soy miembro o admin |

### B.14 Paginación

**Query params:** `?page=1&limit=20`

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

Límite máximo: 100 items por página.

### B.15 Códigos de error

```typescript
const ERROR_CODES = {
  // Auth
  'auth/invalid-credentials': { status: 401, message: 'Correo o contraseña incorrectos' },
  'auth/token-expired': { status: 401, message: 'Tu sesión expiró, inicia sesión nuevamente' },
  'auth/token-invalid': { status: 401, message: 'Sesión inválida' },
  'auth/token-revoked': { status: 401, message: 'Sesión revocada por seguridad' },
  'auth/email-exists': { status: 409, message: 'Este correo ya está registrado' },

  // Validation
  'validation/error': { status: 400, message: 'Datos inválidos' },

  // Groups
  'group/full': { status: 409, message: 'Este grupo no tiene cupos disponibles' },
  'group/closed': { status: 409, message: 'Este grupo está cerrado' },
  'group/already-member': { status: 409, message: 'Ya eres miembro de este grupo' },
  'group/not-owner': { status: 403, message: 'Solo el administrador puede hacer esto' },
  'group/slots-exceeded': { status: 409, message: 'No hay cupos disponibles' },
  'group/has-pending-payments': { status: 409, message: 'Hay pagos pendientes de confirmar' },

  // Memberships
  'membership/not-found': { status: 404, message: 'Membresía no encontrada' },
  'membership/invalid-transition': { status: 409, message: 'Esta acción no es válida en el estado actual' },
  'membership/not-eligible-removal': { status: 409, message: 'Este miembro no puede ser expulsado aún' },

  // Payments
  'payment/not-found': { status: 404, message: 'Pago no encontrado' },
  'payment/already-confirmed': { status: 409, message: 'Este pago ya fue confirmado' },
  'payment/invalid-transition': { status: 409, message: 'Esta acción no es válida en el estado actual' },

  // Ratings
  'rating/already-rated': { status: 409, message: 'Ya calificaste a este usuario en este grupo' },
  'rating/not-eligible': { status: 403, message: 'No puedes calificar aún' },

  // Users
  'user/new-user-limit': { status: 429, message: 'Límite alcanzado para usuarios nuevos' },

  // Rate limit
  'rate-limit/exceeded': { status: 429, message: 'Demasiados intentos, espera unos minutos' },

  // General
  'general/not-found': { status: 404, message: 'No encontrado' },
  'general/forbidden': { status: 403, message: 'No tienes permiso para esto' },
  'general/internal-error': { status: 500, message: 'Error interno, intenta más tarde' }
}
```

### B.16 Rate Limiting (configurable)

| Endpoint | Límite | Ventana | Key |
|----------|--------|---------|-----|
| `POST /auth/login` | 5 (configurable) | 15 min | IP + correo |
| `POST /auth/register` | 10 (configurable) | 1 hora | IP |
| `POST /auth/refresh` | 10 | 1 min | IP |
| General (autenticado) | 100 | 1 min | User ID |

- Desactivar en `NODE_ENV=test`
- Límites configurables por variables de entorno

---

## C. Tareas Cron

### C.1 Configuración general

```typescript
const TIMEZONE = 'America/Bogota'

// Ejecutar al arrancar (para demos y si el server estuvo apagado)
export async function runAllJobsOnStartup() {
  const now = new Date()
  await generatePaymentCycles(now)
  await markOverdue(now)
  await sendReminders(now)
}

// Programar crons
cron.schedule('5 0 * * *', () => generatePaymentCycles(new Date()), { timezone: TIMEZONE })
cron.schedule('10 0 * * *', () => markOverdue(new Date()), { timezone: TIMEZONE })
cron.schedule('0 9 * * *', () => sendReminders(new Date()), { timezone: TIMEZONE })
```

### C.2 Script manual para demos

```bash
npm run jobs:run                       # Ejecuta todos con fecha actual
npm run jobs:run -- --date=2026-11-15  # Simula fecha específica
```

### C.3 Generar cuotas (idempotente)

```typescript
async function generatePaymentCycles(now: Date) {
  const nextMonth = formatPeriod(addMonths(now, 1), TIMEZONE)

  const memberships = await prisma.membership.findMany({
    where: {
      status: 'ACTIVE',
      group: { status: { in: ['OPEN', 'FULL'] } },
      cycles: { none: { period: nextMonth } }
    },
    include: { group: true }
  })

  if (memberships.length === 0) return

  await prisma.paymentCycle.createMany({
    data: memberships.map(m => ({
      membershipId: m.id,
      period: nextMonth,
      amount: m.group.pricePerMember,
      dueDate: buildDueDate(nextMonth, m.group.paymentDay, TIMEZONE),
      status: 'PENDING'
    })),
    skipDuplicates: true
  })
}
```

### C.4 Marcar atrasos

```typescript
async function markOverdue(now: Date) {
  const gracePeriodDays = 3
  const cutoffDate = subDays(now, gracePeriodDays)

  await prisma.paymentCycle.updateMany({
    where: {
      status: 'PENDING',
      dueDate: { lt: cutoffDate },
      membership: {
        status: 'ACTIVE',
        group: { status: { in: ['OPEN', 'FULL'] } }
      }
    },
    data: {
      status: 'OVERDUE',
      overdueAt: now
    }
  })
}
```

### C.5 Recordatorios

- Solo cuotas `PENDING` de membresías `ACTIVE` en grupos `OPEN`/`FULL`
- Deduplicación por constraint `@@unique([userId, type, paymentId])`
- Fallo de push no aborta el lote
- Tokens inválidos se eliminan automáticamente

```typescript
async function sendNotificationSafe(payment, type, content) {
  try {
    await prisma.notification.create({
      data: { userId, type, paymentId: payment.id, ...content }
    })
  } catch (e) {
    if (e.code === 'P2002') return  // Ya existe
    throw e
  }

  const tokens = await prisma.pushToken.findMany({ where: { userId } })
  for (const t of tokens) {
    try {
      await sendExpoPush(t.token, content)
    } catch (e) {
      if (isInvalidTokenError(e)) {
        await prisma.pushToken.delete({ where: { id: t.id } })
      }
    }
  }
}
```

---

## D. Estado Global - RTK Query

### D.1 Tags

```typescript
tagTypes: ['User', 'Group', 'Membership', 'Payment', 'Rating', 'Service', 'Notification']
```

### D.2 Patrón de invalidación

```typescript
// Lista usa id: 'LIST'
providesTags: (result) =>
  result
    ? [...result.data.map(g => ({ type: 'Group', id: g.id })), { type: 'Group', id: 'LIST' }]
    : [{ type: 'Group', id: 'LIST' }]

// Aprobar membresía invalida grupos (cupos cambian)
invalidatesTags: [
  { type: 'Membership', id },
  { type: 'Membership', id: 'LIST' },
  { type: 'Group', id: 'LIST' }
]
```

### D.3 Push notifications en foreground

```typescript
function handleForegroundNotification(notification) {
  switch (notification.type) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_REJECTED':
      store.dispatch(api.util.invalidateTags([
        { type: 'Payment', id: notification.data.paymentId },
        { type: 'Payment', id: 'LIST' }
      ]))
      break
    // ...
  }
}
```

### D.4 Logout

```typescript
async function logout() {
  await logoutMutation({ refreshToken, pushToken })
  store.dispatch(api.util.resetApiState())  // Limpiar caché
}
```

---

## E. Usuarios de prueba (seed)

Solo ejecutar si `NODE_ENV !== 'production'`.

### E.1 Usuarios

```typescript
const users = [
  { email: "owner@example.com", password: "Test1234!", name: "Dueño de Grupo", role: "USER" },
  { email: "member@example.com", password: "Test1234!", name: "Miembro Activo", role: "USER" },
  { email: "member2@example.com", password: "Test1234!", name: "Segundo Miembro", role: "USER" },
  { email: "moderator@example.com", password: "Test1234!", name: "Moderador Cuotix", role: "ADMIN" }
]
```

### E.2 Datos de ejemplo

- 1 grupo con cupos disponibles
- 1 membresía `ACTIVE` con historial
- 1 membresía `PENDING` (solicitud)
- Cuotas en cada estado: `CONFIRMED`, `OVERDUE`, `PENDING`

---

## F. Resumen de cambios al schema Prisma

```prisma
// Enum actualizado
enum PaymentStatus { PENDING MARKED_PAID CONFIRMED OVERDUE CANCELLED }

// Enum nuevo
enum NotificationType { ... }

// Campos nuevos en Membership
leavesAt    DateTime?
firstAmount Int?

// Campos nuevos en PaymentCycle
rejectionReason String?
overdueAt       DateTime?

// Modelos nuevos
model PushToken { ... }
model RefreshToken { ... }  // Con tokenHash
model Notification { ... }  // Con @@unique([userId, type, paymentId])
```
