# Cuotix: Especificaciones de Pruebas

> Estrategia de testing y casos de prueba.
> Aprobado: 2026-11-12

---

## Estrategia General

| Tipo | Cuándo | Herramienta |
|------|--------|-------------|
| Unit Tests | Cada funcionalidad implementada | Jest |
| Integration Tests | Cada grupo de funcionalidades | Jest + Supertest |
| Component Tests | Cada componente UI | jest-expo + RNTL |
| E2E Tests | Al final (Fase 9) | Manual con guión |

**Regla:** No se pasa a la siguiente fase sin que todos los tests pasen.

---

## 1. Configuración

### 1.1 Backend

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
}
```

```typescript
// jest.config.js (actualizado)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],  // Carga .env.test ANTES de todo
  setupFilesAfterEnv: ['./tests/setup.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
}
// Crear archivo .env.test con DATABASE_URL apuntando a BD de prueba
```

```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client'

// PrismaClient ya lee DATABASE_URL del .env.test cargado en setupFiles
const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Limpiar BD antes de cada test
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.rating.deleteMany(),
    prisma.report.deleteMany(),
    prisma.paymentCycle.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.group.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.pushToken.deleteMany(),
    prisma.user.deleteMany(),
  ])
})
```

```typescript
// tests/helpers/factories.ts
export async function createUser(data?: Partial<User>) {
  return prisma.user.create({
    data: {
      email: `user-${Date.now()}@example.com`,
      passwordHash: await hashPassword('Test1234!'),
      name: 'Test User',
      ...data,
    },
  })
}

export async function createGroup(data?: Partial<Group>) {
  const owner = data?.ownerId ? null : await createUser()
  const service = await prisma.service.findFirst()

  return prisma.group.create({
    data: {
      title: 'Test Group',
      ownerId: data?.ownerId ?? owner!.id,
      serviceId: service!.id,
      pricePerMember: 8000,
      paymentDay: 15,
      slots: 4,
      payoutMethod: 'nequi',
      payoutDetail: '3001234567',
      ...data,
    },
  })
}

export async function createMembership(data: {
  groupId: string
  userId: string
  status?: MembershipStatus
}) {
  return prisma.membership.create({
    data: {
      groupId: data.groupId,
      userId: data.userId,
      status: data.status ?? 'PENDING',
    },
  })
}

export async function createPayment(data: {
  membershipId: string
  status?: PaymentStatus
  dueDate?: Date
  period?: string
}) {
  return prisma.paymentCycle.create({
    data: {
      membershipId: data.membershipId,
      period: data.period ?? '2026-11',
      amount: 8000,
      dueDate: data.dueDate ?? new Date('2026-11-15'),
      status: data.status ?? 'PENDING',
    },
  })
}

// Helper compuesto: crea owner, grupo, miembro y membresía ACTIVE
export async function setupActiveMembership() {
  const owner = await createUser({ email: 'owner@example.com' })
  const member = await createUser({ email: 'member@example.com' })
  const group = await createGroup({ ownerId: owner.id })
  const membership = await createMembership({
    groupId: group.id,
    userId: member.id,
    status: 'ACTIVE',
  })
  return { owner, member, group, membership }
}

// Helper compuesto: crea todo + una cuota
export async function setupPayment(paymentData?: {
  status?: PaymentStatus
  dueDate?: Date
}) {
  const { owner, member, group, membership } = await setupActiveMembership()
  const payment = await createPayment({
    membershipId: membership.id,
    status: paymentData?.status,
    dueDate: paymentData?.dueDate,
  })
  return { owner, member, group, membership, payment }
}
```

```typescript
// tests/helpers/auth.ts
import jwt from 'jsonwebtoken'

export function generateToken(user: User): string {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET!,  // Usar JWT_ACCESS_SECRET según IMPLEMENTATION_SPEC
    { expiresIn: '1h' }
  )
}

export function authHeader(user: User): { Authorization: string } {
  return { Authorization: `Bearer ${generateToken(user)}` }
}
```

### 1.2 Mobile

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    './__tests__/setup.ts',
    // Nota: @testing-library/jest-native está obsoleto
    // Los matchers ahora vienen incluidos en React Native Testing Library
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*)',
  ],
}
```

```typescript
// __tests__/setup.ts
import { jest } from '@jest/globals'

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[mock]' }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
}))

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}))
```

---

## 2. Casos de Prueba por Módulo

### 2.1 Auth (Backend)

#### Unit Tests
```typescript
describe('AuthService', () => {
  describe('hashPassword', () => {
    it('genera hash diferente al password original', async () => {
      const hash = await authService.hashPassword('Test1234!')
      expect(hash).not.toBe('Test1234!')
      expect(hash.length).toBeGreaterThan(50)
    })
  })

  describe('verifyPassword', () => {
    it('retorna true para password correcto', async () => {
      const hash = await authService.hashPassword('Test1234!')
      const result = await authService.verifyPassword('Test1234!', hash)
      expect(result).toBe(true)
    })

    it('retorna false para password incorrecto', async () => {
      const hash = await authService.hashPassword('Test1234!')
      const result = await authService.verifyPassword('Wrong123!', hash)
      expect(result).toBe(false)
    })
  })

  describe('generateTokens', () => {
    it('genera access y refresh token', async () => {
      const user = await createUser()
      const tokens = await authService.generateTokens(user)

      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
    })

    it('guarda hash del refresh token en BD', async () => {
      const user = await createUser()
      await authService.generateTokens(user)

      const stored = await prisma.refreshToken.findFirst({
        where: { userId: user.id },
      })
      expect(stored).toBeDefined()
      expect(stored!.tokenHash).toBeDefined()
    })
  })

  describe('validateRefreshToken', () => {
    it('retorna usuario si token válido', async () => {
      const user = await createUser()
      const { refreshToken } = await authService.generateTokens(user)

      const result = await authService.validateRefreshToken(refreshToken)
      expect(result.id).toBe(user.id)
    })

    it('lanza error si token no existe', async () => {
      await expect(
        authService.validateRefreshToken('invalid-token')
      ).rejects.toThrow()
    })

    it('revoca todos los tokens si token ya usado', async () => {
      const user = await createUser()
      const { refreshToken } = await authService.generateTokens(user)

      // Usar token
      await authService.rotateRefreshToken(refreshToken)

      // Intentar usar de nuevo
      await expect(
        authService.validateRefreshToken(refreshToken)
      ).rejects.toThrow()

      // Verificar que todos fueron revocados
      const count = await prisma.refreshToken.count({
        where: { userId: user.id },
      })
      expect(count).toBe(0)
    })
  })
})
```

#### Integration Tests
```typescript
describe('Auth Endpoints', () => {
  describe('POST /auth/register', () => {
    it('crea usuario y retorna tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test1234!',
          name: 'Test User',
        })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      })
      expect(res.body.user).not.toHaveProperty('passwordHash')
    })

    it('rechaza email duplicado', async () => {
      await createUser({ email: 'test@example.com' })

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test1234!',
          name: 'Test User',
        })

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('auth/email-exists')
    })

    it('valida email inválido', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Test1234!',
          name: 'Test User',
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('validation/error')
    })

    it('valida password débil', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User',
        })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /auth/login', () => {
    it('retorna tokens con credenciales válidas', async () => {
      await createUser({ email: 'test@example.com' })

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test1234!',
        })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('accessToken')
      expect(res.body).toHaveProperty('refreshToken')
    })

    it('rechaza credenciales inválidas', async () => {
      await createUser({ email: 'test@example.com' })

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword!',
        })

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('auth/invalid-credentials')
    })
  })

  describe('POST /auth/refresh', () => {
    it('rota tokens correctamente', async () => {
      const user = await createUser()
      const { refreshToken } = await authService.generateTokens(user)

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })

      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
      expect(res.body.refreshToken).not.toBe(refreshToken)
    })
  })

  describe('GET /me', () => {
    it('retorna usuario autenticado', async () => {
      const user = await createUser()

      const res = await request(app)
        .get('/api/v1/me')
        .set(authHeader(user))

      expect(res.status).toBe(200)
      expect(res.body.email).toBe(user.email)
    })

    it('rechaza sin token', async () => {
      const res = await request(app).get('/api/v1/me')
      expect(res.status).toBe(401)
    })
  })
})
```

### 2.2 Groups (Backend)

#### Unit Tests
```typescript
describe('GroupsService', () => {
  describe('createGroup', () => {
    it('valida slots <= maxMembers - 1', async () => {
      const user = await createUser()
      const service = await prisma.service.findFirst() // maxMembers: 6

      await expect(
        groupsService.createGroup(user.id, {
          serviceId: service!.id,
          title: 'Test',
          slots: 6, // Más que maxMembers - 1
          pricePerMember: 8000,
          paymentDay: 15,
          payoutMethod: 'nequi',
          payoutDetail: '300123',
        })
      ).rejects.toThrow()
    })
  })

  describe('getGroupDetail', () => {
    it('oculta payoutDetail a no miembros', async () => {
      const owner = await createUser()
      const stranger = await createUser()
      const group = await createGroup({ ownerId: owner.id })

      const result = await groupsService.getGroupDetail(group.id, stranger.id)
      expect(result.payoutDetail).toBeUndefined()
    })

    it('muestra payoutDetail a miembros ACTIVE', async () => {
      const owner = await createUser()
      const member = await createUser()
      const group = await createGroup({ ownerId: owner.id })
      await createMembership({
        groupId: group.id,
        userId: member.id,
        status: 'ACTIVE',
      })

      const result = await groupsService.getGroupDetail(group.id, member.id)
      expect(result.payoutDetail).toBe('3001234567')
    })
  })

  describe('closeGroup', () => {
    it('falla si hay pagos MARKED_PAID', async () => {
      const owner = await createUser()
      const member = await createUser()
      const group = await createGroup({ ownerId: owner.id })
      const membership = await createMembership({
        groupId: group.id,
        userId: member.id,
        status: 'ACTIVE',
      })
      await createPayment({
        membershipId: membership.id,
        status: 'MARKED_PAID',
      })

      await expect(
        groupsService.closeGroup(group.id, owner.id)
      ).rejects.toThrow('group/has-pending-payments')
    })

    it('cancela cuotas pendientes', async () => {
      const owner = await createUser()
      const member = await createUser()
      const group = await createGroup({ ownerId: owner.id })
      const membership = await createMembership({
        groupId: group.id,
        userId: member.id,
        status: 'ACTIVE',
      })
      const payment = await createPayment({
        membershipId: membership.id,
        status: 'PENDING',
      })

      await groupsService.closeGroup(group.id, owner.id)

      const updated = await prisma.paymentCycle.findUnique({
        where: { id: payment.id },
      })
      expect(updated!.status).toBe('CANCELLED')
    })
  })
})
```

### 2.3 Memberships (Backend)

#### Integration Tests
```typescript
describe('Memberships Endpoints', () => {
  describe('PATCH /memberships/:id/approve', () => {
    it('valida cupos en transacción', async () => {
      const owner = await createUser()
      const group = await createGroup({ ownerId: owner.id, slots: 1 })

      const member1 = await createUser()
      const member2 = await createUser()

      const m1 = await createMembership({ groupId: group.id, userId: member1.id })
      const m2 = await createMembership({ groupId: group.id, userId: member2.id })

      // Aprobar primera
      const res1 = await request(app)
        .patch(`/api/v1/memberships/${m1.id}/approve`)
        .set(authHeader(owner))

      expect(res1.status).toBe(200)

      // Segunda debe fallar
      const res2 = await request(app)
        .patch(`/api/v1/memberships/${m2.id}/approve`)
        .set(authHeader(owner))

      expect(res2.status).toBe(409)
      expect(res2.body.error.code).toBe('group/slots-exceeded')
    })

    it('guarda firstAmount', async () => {
      const owner = await createUser()
      const member = await createUser()
      const group = await createGroup({ ownerId: owner.id })
      const membership = await createMembership({
        groupId: group.id,
        userId: member.id,
      })

      const res = await request(app)
        .patch(`/api/v1/memberships/${membership.id}/approve`)
        .set(authHeader(owner))
        .send({ firstAmount: 5000 })

      expect(res.status).toBe(200)

      const updated = await prisma.membership.findUnique({
        where: { id: membership.id },
      })
      expect(updated!.firstAmount).toBe(5000)
    })
  })

  describe('POST /memberships/:id/confirm-access', () => {
    it('crea primera cuota', async () => {
      const owner = await createUser()
      const member = await createUser()
      const group = await createGroup({ ownerId: owner.id })
      const membership = await createMembership({
        groupId: group.id,
        userId: member.id,
        status: 'APPROVED',
      })

      const res = await request(app)
        .post(`/api/v1/memberships/${membership.id}/confirm-access`)
        .set(authHeader(member))

      expect(res.status).toBe(200)

      const payments = await prisma.paymentCycle.findMany({
        where: { membershipId: membership.id },
      })
      expect(payments).toHaveLength(1)
      expect(payments[0].status).toBe('PENDING')
    })
  })
})
```

### 2.4 Payments (Backend)

```typescript
describe('Payments Endpoints', () => {
  describe('POST /payments/:id/mark-paid', () => {
    it('permite transición OVERDUE → MARKED_PAID', async () => {
      const { payment, member } = await setupPayment({ status: 'OVERDUE' })

      const res = await request(app)
        .post(`/api/v1/payments/${payment.id}/mark-paid`)
        .set(authHeader(member))
        .send({ reference: '1234' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('MARKED_PAID')
    })
  })

  describe('POST /payments/:id/reject', () => {
    it('requiere motivo de al menos 10 caracteres', async () => {
      const { payment, owner } = await setupPayment({ status: 'MARKED_PAID' })

      const res = await request(app)
        .post(`/api/v1/payments/${payment.id}/reject`)
        .set(authHeader(owner))
        .send({ reason: 'corto' })

      expect(res.status).toBe(400)
    })

    it('limpia markedPaidAt', async () => {
      const { payment, owner } = await setupPayment({ status: 'MARKED_PAID' })

      const res = await request(app)
        .post(`/api/v1/payments/${payment.id}/reject`)
        .set(authHeader(owner))
        .send({ reason: 'No encontré la transferencia con esa referencia' })

      expect(res.status).toBe(200)

      const updated = await prisma.paymentCycle.findUnique({
        where: { id: payment.id },
      })
      expect(updated!.markedPaidAt).toBeNull()
      expect(updated!.rejectionReason).toBe('No encontré la transferencia con esa referencia')
    })
  })
})
```

### 2.5 Jobs (Backend)

```typescript
describe('generatePaymentCycles', () => {
  it('es idempotente', async () => {
    const { membership } = await setupActiveMembership()

    const now = new Date('2026-11-01')
    await generatePaymentCycles(now)
    await generatePaymentCycles(now)

    const payments = await prisma.paymentCycle.findMany({
      where: { membershipId: membership.id },
    })
    expect(payments).toHaveLength(1)
  })

  it('ignora grupos CLOSED', async () => {
    const { membership, group } = await setupActiveMembership()
    await prisma.group.update({
      where: { id: group.id },
      data: { status: 'CLOSED' },
    })

    await generatePaymentCycles(new Date('2026-11-01'))

    const payments = await prisma.paymentCycle.findMany({
      where: { membershipId: membership.id },
    })
    expect(payments).toHaveLength(0)
  })
})

describe('markOverdue', () => {
  it('respeta días de gracia', async () => {
    const { payment } = await setupPayment({
      status: 'PENDING',
      dueDate: new Date('2026-11-10'),
    })

    // Día 12 (2 días después) - dentro de gracia
    await markOverdue(new Date('2026-11-12'))
    let updated = await prisma.paymentCycle.findUnique({
      where: { id: payment.id },
    })
    expect(updated!.status).toBe('PENDING')

    // Día 14 (4 días después) - fuera de gracia
    await markOverdue(new Date('2026-11-14'))
    updated = await prisma.paymentCycle.findUnique({
      where: { id: payment.id },
    })
    expect(updated!.status).toBe('OVERDUE')
  })
})
```

### 2.6 Componentes (Mobile)

```typescript
describe('AppButton', () => {
  it('tiene accessibilityRole="button"', () => {
    const { getByRole } = render(
      <AppButton title="Test" onPress={() => {}} />
    )
    expect(getByRole('button')).toBeTruthy()
  })

  it('anuncia estado disabled', () => {
    const { getByRole } = render(
      <AppButton title="Test" onPress={() => {}} disabled />
    )
    const button = getByRole('button')
    expect(button.props.accessibilityState.disabled).toBe(true)
  })

  it('anuncia estado loading', () => {
    const { getByRole } = render(
      <AppButton title="Test" onPress={() => {}} loading />
    )
    const button = getByRole('button')
    expect(button.props.accessibilityState.busy).toBe(true)
  })

  it('no ejecuta onPress si disabled', () => {
    const onPress = jest.fn()
    const { getByRole } = render(
      <AppButton title="Test" onPress={onPress} disabled />
    )
    fireEvent.press(getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })
})

describe('AppInput', () => {
  it('muestra label visible', () => {
    const { getByText } = render(<AppInput label="Email" />)
    expect(getByText('Email')).toBeTruthy()
  })

  it('anuncia error con liveRegion', () => {
    const { getByText } = render(
      <AppInput label="Email" error="Email inválido" />
    )
    const error = getByText('Email inválido')
    expect(error.props.accessibilityLiveRegion).toBe('polite')
  })

  it('muestra icono de error', () => {
    const { getByTestId } = render(
      <AppInput label="Email" error="Error" />
    )
    expect(getByTestId('error-icon')).toBeTruthy()
  })
})

describe('StatusBadge', () => {
  const statuses = ['pending', 'markedPaid', 'confirmed', 'overdue', 'cancelled']

  statuses.forEach((status) => {
    it(`renderiza ${status} con icono y texto`, () => {
      const { getByTestId, getByText } = render(
        <StatusBadge status={status as any} />
      )
      expect(getByTestId(`icon-${status}`)).toBeTruthy()
      // El texto debe existir
      expect(getByText(/.+/)).toBeTruthy()
    })
  })
})
```

---

## 3. Pruebas E2E (Fase 9)

### 3.1 Flujos

Ver `IMPLEMENTATION_PHASES.md` Fase 9 para los guiones detallados.

### 3.2 Formato de Reporte

```markdown
# Reporte E2E

## Información
- **Fecha:** YYYY-MM-DD
- **Tester:** Nombre
- **Dispositivo:** iPhone 14 / Pixel 6
- **Versión App:** 1.0.0

## Resultados

| Flujo | Estado | Bugs |
|-------|--------|------|
| E2E-1: Registro y Login | PASS/FAIL | #1, #2 |
| E2E-2: Crear Grupo | PASS/FAIL | - |
| E2E-3: Ciclo de Pago | PASS/FAIL | #3 |
| E2E-4: Manejo de Errores | PASS/FAIL | - |
| E2E-5: Accesibilidad | PASS/FAIL | - |

## Bugs Encontrados

| # | Descripción | Severidad | Pantalla |
|---|-------------|-----------|----------|
| 1 | ... | Alta/Media/Baja | Login |

## Evidencias
- /docs/evidence/e2e-1-*.png
- /docs/evidence/e2e-2-*.png
```

---

## 4. Cobertura Mínima

| Módulo | Meta |
|--------|------|
| Backend: Auth | 90% |
| Backend: Groups | 80% |
| Backend: Memberships | 80% |
| Backend: Payments | 85% |
| Backend: Jobs | 90% |
| Mobile: Componentes Base | 100% |

Verificar con:
```bash
cd backend && npm run test:coverage
```

---

## 5. Scripts

### Backend
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration"
  }
}
```

### Mobile
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```
