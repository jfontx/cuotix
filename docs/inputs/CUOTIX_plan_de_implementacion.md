# Cuotix: Plan de implementación del MVP

> Documento de contexto, decisiones y guía de construcción.
> Equipo: David Alejandro Castiblanco, Jorge Montalvo, Jacobo Acosta.
> Asignatura: Desarrollo de Aplicaciones Móviles, Universidad de La Sabana.

---

## 1. Contexto del proyecto

**Cuotix** es una app móvil para organizar grupos que comparten el costo de suscripciones digitales (streaming, música, software). Hoy eso ocurre de forma informal por WhatsApp o Facebook, sin control de cupos, cobros ni reputación.

- **Tagline:** Comparte tus suscripciones, paga solo tu cuota.
- **Roles de usuario:**
  - **Administrador:** paga la suscripción y tiene cupos disponibles que quiere compartir.
  - **Miembro:** quiere acceder a un servicio pagando solo una fracción del costo.
  - **Admin interno de Cuotix:** modera reportes (alcance mínimo en el MVP).
- **Restricción de cumplimiento:** el producto no busca facilitar el uso compartido no autorizado. Solo opera dentro de los planes multiusuario que cada servicio permite oficialmente.

### 1.1 Requisitos de la entrega final (resumen)

| Componente | Peso | Qué se evalúa |
|---|---|---|
| Documento final | 20% | Visión, arquitectura, accesibilidad, pruebas y conclusiones (5 secciones) |
| Funcionalidad y repositorio | 30% | App funcional de extremo a extremo, sin mocks injustificados, README reproducible, commits equitativos |
| Presentación y demo en vivo | 10% | Pitch y demo en dispositivo o emulador |
| Defensa técnica individual | 40% | Preguntas aleatorias a cada integrante sobre cualquier parte del código |

Implicaciones directas para el diseño del proyecto:

- Todo flujo debe leer y escribir datos reales en la base de datos.
- Cada integrante debe conocer cualquier parte del código, así que se prioriza la simplicidad y la reparto vertical del trabajo.
- La accesibilidad móvil se evalúa en el código (roles, etiquetas, foco, contraste, áreas táctiles), así que se diseña desde la base.
- La entrega puede correr en local: el enunciado pide README con instalación y ejecución, y demo en dispositivo o emulador. No exige despliegue en internet. Conviene confirmarlo con el profesor.

---

## 2. Decisiones tomadas

### 2.1 Pagos: pago manual entre usuarios (sin pasarela)

**Decisión:** Cuotix **no procesa ni custodia dinero**. El miembro le paga directamente al administrador (transferencia, Nequi, Daviplata o Bre-B). Cuotix registra, recuerda y confirma.

**Por qué se descartó la pasarela y el pago retenido (escrow):**

1. **Comisiones altas para cuotas pequeñas.** Según las tarifas publicadas que se consultaron (deben verificarse con cotización oficial), Wompi cobra 2,65% + $700 + IVA por transacción aprobada y PayU 2,99% + IVA + $700 con tarjeta. En una cuota de $10.000 COP la comisión ronda el 11-12% (estimación propia, IVA del 19% sobre la comisión).
2. **Riesgo regulatorio.** Retener dinero de terceros y liberarlo después puede ser una actividad regulada en Colombia. Las pasarelas están pensadas para cobrar, no para custodiar fondos entre usuarios.
3. **Alcance.** Pagos recurrentes, webhooks, idempotencia, ledger, conciliación y desembolsos no caben con calidad en un semestre con tres personas, junto con la accesibilidad.

**Consecuencia:** se pierden el cobro automático y el pago retenido de la propuesta original. Se compensa con reputación, confirmación doble y una regla de protección al miembro (ver sección 4.4). En el documento final esto se presenta como **decisión de ingeniería documentada** (evolución del producto), no como incumplimiento.

**Trabajo futuro:** integrar una pasarela con cobros recurrentes tokenizados.

### 2.2 Backend y base de datos: reales y separados

No se usa Supabase como backend. Hay una API propia y una base de datos PostgreSQL en servicio separado.

| Capa | Elección | Justificación |
|---|---|---|
| Backend | Node.js + Express + TypeScript | Más simple de explicar que NestJS; los tres deben poder defender cualquier archivo |
| Validación | Zod | Valida entradas y deriva tipos |
| ORM | Prisma | Esquema declarativo, migraciones y relación directa con el diagrama ER |
| Base de datos | PostgreSQL | Relaciones claras (grupos, membresías, cuotas) y transacciones |
| Autenticación | Correo + contraseña, JWT (access + refresh), hash con Argon2 o bcrypt | Google Sign-In queda opcional |
| Tareas programadas | `node-cron` dentro del backend | Genera cuotas mensuales, marca atrasos y envía recordatorios |
| Notificaciones | Expo Notifications | Recordatorios y avisos de "ya pagó" |
| Contrato de API | OpenAPI (Swagger) | Documenta endpoints para el documento y la defensa |

### 2.3 Ejecución: primero local

- Backend y PostgreSQL con **Docker Compose** en local.
- App en emulador Android, simulador iOS o celular físico en la misma red.
- Despliegue en internet (Render, Railway, Fly, Neon, etc.) solo si sobra tiempo. Los planes gratuitos cambian y algunos duermen el servidor, lo que detiene los cron jobs.
- Para la demo: el emulador Android accede al computador por `10.0.2.2`; el simulador iOS usa `localhost`; un celular físico requiere la IP local del computador y que la red no bloquee la comunicación entre dispositivos. Se recomienda tener una grabación de respaldo.

### 2.4 Estado global: Redux Toolkit + RTK Query

**Restricción:** no se usa Zustand. La herramienta elegida debe justificarse ante el profesor.

**Distinción clave:**

- **Estado del servidor:** grupos, membresías, cuotas, calificaciones. Vive en la base de datos y la app lo cachea.
- **Estado del cliente:** sesión, tema y preferencias de accesibilidad, borradores de formularios.

**Comparación de opciones:**

| Opción | A favor | En contra |
|---|---|---|
| **Redux Toolkit + RTK Query** | Una sola herramienta cubre estado cliente y servidor; caché, reintentos e invalidación incluidos; flujo predecible; DevTools | Más boilerplate y curva de aprendizaje |
| Context + `useReducer` | Sin dependencias | Re-renderizados amplios, sin DevTools, caché remota a mano |
| Context + TanStack Query | Muy buena para datos remotos | Dos herramientas que explicar |
| Jotai / MobX | Livianos | Menos estándar para justificar; Jotai se parece a Zustand en filosofía |

**Elección y justificación para la defensa:**

1. Resuelve estado local y asíncrono con un solo ecosistema.
2. Trazabilidad de acciones y cambios de estado en DevTools, útil para depurar y explicar en vivo.
3. Un patrón único (slice, selector, hook) que los tres integrantes repiten, lo que facilita responder sobre cualquier parte.
4. Un `settingsSlice` centraliza tema, alto contraste y escala tipográfica, consumidos por toda la app.
5. Está explícitamente permitida en el enunciado.

**Alternativa si se prefiere menos boilerplate:** Context para sesión y tema + TanStack Query para datos remotos. El resto del plan no cambia.

### 2.5 Móvil

- React Native + Expo (development build, porque algunas librerías no funcionan en Expo Go) + TypeScript.
- **Expo Router** para navegación.
- **React Hook Form + Zod** para formularios.
- Sesión en `expo-secure-store`.
- Pruebas con `jest-expo` y React Native Testing Library.

---

## 3. Alcance del MVP

### 3.1 Debe tener (Must)

- Registro e inicio de sesión (correo y contraseña).
- Perfil de usuario básico.
- Catálogo de servicios con **guía de compatibilidad** (2 o 3 servicios curados a mano).
- Crear, buscar y ver grupos; solicitar unirse; aprobar o rechazar solicitudes; control de cupos.
- Confirmación de acceso por parte del miembro ("ya tengo acceso").
- Cuotas mensuales por miembro con ciclo de pago manual (sección 4.3).
- Datos de cobro del administrador, visibles solo para miembros aprobados.
- Recordatorios de pago por notificación push.
- Calificaciones entre usuarios.
- Reportes de usuarios.
- Accesibilidad implementada en todas las pantallas (sección 6).

### 3.2 Debería tener (Should)

- Referencia de pago en texto (número de transferencia).
- Historial de pagos por usuario.
- Moderación básica de reportes.
- Actualizaciones en tiempo real del estado de pago (por ejemplo, consulta periódica o push).

### 3.3 Fuera del MVP

- Pasarela de pagos, pago retenido y reembolsos automáticos.
- Chat interno (se usa notificación y comentarios).
- Verificación de identidad con documentos.
- Subida de comprobantes como imagen (se evalúa al final por la infraestructura extra).
- Panel analítico, soporte multidivisa e integraciones con APIs de las plataformas.

---

## 4. Reglas de negocio

### 4.1 Ciclo de vida del grupo

`OPEN` (con cupos) → `FULL` (sin cupos) → `CLOSED`. También `PAUSED` si el administrador detiene el grupo temporalmente.

- El número máximo de miembros lo limita el catálogo del servicio.
- Un grupo `FULL` vuelve a `OPEN` si alguien sale.

### 4.2 Ciclo de vida de la membresía

`PENDING` (solicitud) → `APPROVED` → `ACTIVE` (acceso confirmado) → `LEFT` o `REMOVED`.
Una solicitud puede terminar en `REJECTED`.

- `ACTIVE` solo se alcanza cuando el miembro confirma que ya tiene acceso al servicio.
- La mora se modela en la cuota, no en la membresía (ver abajo).

### 4.3 Ciclo de vida de una cuota (`payment_cycle`)

Una cuota por miembro y por mes.

`PENDING` → `MARKED_PAID` (el miembro declara que pagó) → `CONFIRMED` (el administrador confirma).

- `PENDING` → `OVERDUE` si pasa la fecha de vencimiento más los días de gracia.
- `MARKED_PAID` → `PENDING` (con motivo) si el administrador no encuentra el pago.
- `OVERDUE` → `MARKED_PAID` si el miembro paga tarde.

### 4.4 Reglas de protección y operación (decisiones a ratificar por el equipo)

| Tema | Regla propuesta |
|---|---|
| Primer pago | La primera cuota **solo se genera cuando el miembro confirma acceso**. Así nadie paga sin haber entrado. |
| Cuota y fecha | El administrador define el monto por miembro y el día de pago del grupo. |
| Días de gracia | 3 días después del vencimiento antes de marcar `OVERDUE`. |
| Recordatorios | Push 2 días antes, el día del vencimiento y cuando pasa a `OVERDUE`. |
| Mora prolongada | Tras 2 cuotas `OVERDUE` consecutivas, el administrador puede expulsar al miembro. |
| Salida de un miembro | Efectiva al final del ciclo en curso. Sin reembolsos dentro de Cuotix (cualquier devolución se arregla entre usuarios). |
| Ingreso a mitad de mes | Sin prorrateo en el MVP: la primera cuota cubre desde la confirmación de acceso hasta la siguiente fecha de pago, y el administrador acuerda el monto con el miembro al aprobarlo. *(Decisión a revisar.)* |
| Cupos vacíos | El grupo vuelve a `OPEN` y el administrador decide cómo cubrirlos. |
| Calificaciones | Solo después de al menos una cuota `CONFIRMED` o de la salida del grupo. Una por usuario por grupo. Las calificaciones sospechosas se pueden reportar. |
| Reportes | Cualquier miembro o administrador puede reportar a otro usuario del grupo con motivo y descripción. El admin interno los revisa. |
| Usuarios nuevos | Límite de grupos creados y de solicitudes simultáneas mientras no tengan historial. |

### 4.5 Confirmación doble de pagos

Como Cuotix no ve el dinero, el estado de una cuota se apoya en dos declaraciones: el miembro dice "ya pagué" y el administrador dice "recibido". Si no coinciden, el miembro puede reportar. El **historial de pagos a tiempo** alimenta la reputación y es el principal mecanismo de confianza.

---

## 5. Arquitectura

### 5.1 Vista general

```
App móvil (React Native + Expo)
  Expo Router · Redux Toolkit + RTK Query · expo-secure-store · Expo Notifications
        │  HTTPS / JSON (JWT)
        ▼
API REST (Node.js + Express + TypeScript)
  Rutas · Controladores · Servicios · Zod · Prisma · node-cron
        │                              │
        ▼                              ▼
PostgreSQL (servicio separado)   Expo Push Service
```

### 5.2 Estructura del repositorio

```
cuotix/
├── mobile/            # App Expo
│   ├── app/           # Rutas (Expo Router)
│   └── src/
│       ├── components/    # Componentes base accesibles
│       ├── store/         # store, slices (auth, settings), RTK Query api
│       ├── theme/         # Tokens de color, tipografía, espaciado
│       ├── hooks/
│       └── utils/
├── backend/
│   ├── prisma/        # schema.prisma, migraciones, seed
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── middlewares/   # auth, validación, rate limit, errores
│       ├── jobs/          # cron: cuotas, atrasos, recordatorios
│       └── config/
├── docs/              # Documento final, diagramas, ADRs, OpenAPI
├── docker-compose.yml # API + PostgreSQL en local
└── README.md
```

### 5.3 Estado global en la app

- `authSlice`: usuario y estado de sesión. El token vive en `expo-secure-store`; al arrancar se rehidrata.
- `settingsSlice`: tema, alto contraste, escala tipográfica y preferencias de accesibilidad.
- `api` (RTK Query): endpoints, caché y etiquetas de invalidación (`Groups`, `Memberships`, `Payments`, `Ratings`). Por ejemplo, marcar una cuota como pagada invalida `Payments` y se refresca la lista.
- Estado local de formularios con React Hook Form, no en Redux.

### 5.4 Seguridad

- Hash de contraseñas con Argon2 o bcrypt.
- JWT de acceso de corta duración + refresh token; rotación y revocación al cerrar sesión.
- Validación de todas las entradas con Zod.
- Autorización **por recurso**: un usuario solo ve grupos y cuotas en los que participa; los datos de cobro del administrador solo se exponen a miembros aprobados.
- Rate limiting en login y registro, `helmet` y CORS restrictivo.
- Secretos en variables de entorno, con `.env.example` y sin llaves en el repositorio (el enunciado exige cero credenciales en el historial).
- Datos personales: términos y condiciones, política de privacidad y autorización de tratamiento de datos (Ley 1581 de 2012).

---

## 6. Modelo de datos (borrador)

Entidades: `User`, `Service`, `Group`, `Membership`, `PaymentCycle`, `Rating`, `Report`, `PushToken`, `Notification`, `RefreshToken`.

```prisma
enum GroupStatus      { OPEN FULL PAUSED CLOSED }
enum MembershipStatus { PENDING APPROVED ACTIVE REJECTED LEFT REMOVED }
enum PaymentStatus    { PENDING MARKED_PAID CONFIRMED OVERDUE }
enum ReportStatus     { OPEN REVIEWED DISMISSED }
enum Role             { USER ADMIN }

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  phone        String?
  role         Role     @default(USER)
  createdAt    DateTime @default(now())
  groupsOwned  Group[]  @relation("GroupOwner")
  memberships  Membership[]
  pushTokens   PushToken[]
}

model Service {
  id               String  @id @default(uuid())
  name             String  @unique
  planType         String            // familiar, miembro extra, etc.
  maxMembers       Int
  allowsOutOfHome  Boolean
  notes            String?           // restricciones (misma dirección, etc.)
  lastReviewedAt   DateTime
  groups           Group[]
}

model Group {
  id             String      @id @default(uuid())
  ownerId        String
  serviceId      String
  title          String
  description    String?
  pricePerMember Int                  // COP
  paymentDay     Int                  // día del mes (1-28)
  slots          Int
  status         GroupStatus @default(OPEN)
  payoutMethod   String               // "nequi", "bre-b", "transferencia"
  payoutDetail   String               // número o llave (solo miembros aprobados)
  createdAt      DateTime    @default(now())
  owner          User        @relation("GroupOwner", fields: [ownerId], references: [id])
  service        Service     @relation(fields: [serviceId], references: [id])
  memberships    Membership[]
}

model Membership {
  id        String           @id @default(uuid())
  groupId   String
  userId    String
  status    MembershipStatus @default(PENDING)
  joinedAt  DateTime?
  group     Group            @relation(fields: [groupId], references: [id])
  user      User             @relation(fields: [userId], references: [id])
  cycles    PaymentCycle[]
  @@unique([groupId, userId])
}

model PaymentCycle {
  id            String        @id @default(uuid())
  membershipId  String
  period        String                 // "2026-11"
  amount        Int
  dueDate       DateTime
  status        PaymentStatus @default(PENDING)
  reference     String?                // referencia de la transferencia
  markedPaidAt  DateTime?
  confirmedAt   DateTime?
  membership    Membership    @relation(fields: [membershipId], references: [id])
  @@unique([membershipId, period])
}

model Rating {
  id        String   @id @default(uuid())
  groupId   String
  fromId    String
  toId      String
  score     Int                // 1-5
  comment   String?
  createdAt DateTime @default(now())
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
}
```

Este esquema es un punto de partida. Debe revisarse en el diagrama ER (incluyendo `PushToken`, `Notification` y `RefreshToken`) antes de migrar.

### 6.1 Catálogo inicial de servicios

Empezar con 2 o 3 servicios, **verificando en las páginas oficiales** las condiciones vigentes antes de cargarlas (muchos planes familiares exigen misma dirección). Candidatos: Spotify Familiar, YouTube Premium Familiar, Netflix con miembro extra. La tabla debe incluir fecha de última revisión y un responsable de mantenerla.

---

## 7. API (contrato inicial)

Prefijo `/api/v1`. Autenticación con `Authorization: Bearer <token>` salvo en registro y login.

| Área | Endpoints |
|---|---|
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` |
| Perfil | `GET /me` · `PATCH /me` · `POST /me/push-token` |
| Servicios | `GET /services` · `GET /services/:id` |
| Grupos | `GET /groups` (búsqueda y filtros) · `POST /groups` · `GET /groups/:id` · `PATCH /groups/:id` · `POST /groups/:id/close` |
| Membresías | `POST /groups/:id/join` · `GET /groups/:id/members` · `PATCH /memberships/:id/approve` · `PATCH /memberships/:id/reject` · `POST /memberships/:id/confirm-access` · `POST /memberships/:id/leave` · `POST /memberships/:id/remove` |
| Cuotas | `GET /me/payments` · `GET /groups/:id/payments` · `POST /payments/:id/mark-paid` · `POST /payments/:id/confirm` · `POST /payments/:id/reject` |
| Calificaciones | `POST /ratings` · `GET /users/:id/ratings` |
| Reportes | `POST /reports` · `GET /reports` (solo admin interno) · `PATCH /reports/:id` |

Respuestas de error consistentes (`{ error: { code, message } }`), paginación en listados y especificación publicada con OpenAPI.

### 7.1 Tareas programadas (cron)

| Tarea | Frecuencia | Qué hace |
|---|---|---|
| Generar cuotas | Diaria | Crea las cuotas del mes próximo para membresías `ACTIVE` |
| Marcar atrasos | Diaria | Pasa a `OVERDUE` las cuotas vencidas fuera de los días de gracia |
| Recordatorios | Diaria | Envía push (2 días antes, día de vencimiento, atraso) |

Las tareas deben ser **idempotentes** (ejecutarlas dos veces no duplica cuotas ni notificaciones), apoyándose en las restricciones únicas de la base de datos.

---

## 8. Accesibilidad móvil (se diseña desde el inicio)

### 8.1 Componentes base

`AppButton`, `AppInput`, `AppCard`, `StatusBadge`, `AppText`, `AppScreen`. Resuelven una sola vez roles, etiquetas, estados, `hitSlop` y escalado tipográfico. Todas las pantallas los reutilizan, y la matriz trazable apunta a estos archivos.

### 8.2 Lista de verificación por pantalla

| Tema | Qué se implementa |
|---|---|
| Lectores de pantalla (VoiceOver / TalkBack) | `accessible`, `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`, `accessibilityState` en todos los controles; agrupar tarjetas de grupo y de cuota en un solo foco |
| Contraste | Mínimo 4.5:1 en texto normal; verificado con herramienta y registrado en los tokens de color |
| Tipografía | Respeta el tamaño de fuente del sistema; `lineHeight` suficiente para evitar recortes; probar con fuente al máximo |
| No depender solo del color | Estados de cuota con icono + texto (pagado, pendiente, atrasado) |
| Áreas táctiles | Mínimo 44×44 pt (iOS) / 48×48 dp (Android); `hitSlop` donde corresponda |
| Orden de foco | Orden lógico de lectura; manejar foco al abrir modales y tras acciones |
| Retroalimentación | Mensajes de error y de carga anunciados (`accessibilityLiveRegion` o equivalente) y háptica opcional |
| Automatización | `eslint-plugin-react-native-a11y` en CI |

### 8.3 Matriz trazable (plantilla para el documento)

| Mejora de accesibilidad | Componente / archivo | Prueba de validación | Resultado |
|---|---|---|---|
| Ejemplo: etiqueta y rol en botón principal | `src/components/AppButton.tsx` | TalkBack lee "Unirme, botón" | Pendiente |

Debe llenarse durante el desarrollo, no al final, con evidencia (capturas o notas de pruebas en dispositivo).

---

## 9. Pruebas

| Tipo | Herramienta | Alcance |
|---|---|---|
| Backend: unitarias e integración | Jest + Supertest | Auth, reglas de grupos y cupos, transiciones de estado de cuotas, autorización por recurso |
| Backend: tareas programadas | Jest | Generación idempotente de cuotas y marcado de atrasos |
| Móvil: componentes | jest-expo + React Native Testing Library | Componentes base (roles, etiquetas, estados) y formularios |
| Flujo completo | Manual, con guion | Registro → crear grupo → solicitud → aprobar → confirmar acceso → cuota → "ya pagué" → confirmar → calificar |
| Errores | Manual | Sin red, validación fallida, token vencido, cupo agotado |
| Accesibilidad | TalkBack y VoiceOver en dispositivo real | Pantallas principales, con evidencia |
| Piloto | Grupo cerrado y pequeño | Prueba con usuarios reales (por ejemplo, compañeros) |

---

## 10. Organización del equipo

### 10.1 Reparto vertical

Cada integrante implementa de punta a punta (pantalla, estado, API, base de datos) un módulo. Así cualquiera puede explicar su recorrido completo en la defensa y se evita que una persona domine todo el backend.

| Integrante | Módulo vertical |
|---|---|
| Persona A | Autenticación, perfil, sesión y componentes base de accesibilidad |
| Persona B | Catálogo de servicios, grupos, búsqueda, membresías y cupos |
| Persona C | Cuotas, tareas programadas, notificaciones, calificaciones y reportes |

*(Ajustar nombres según preferencias del equipo.)*

### 10.2 Ingeniería

- Ramas por funcionalidad y pull requests revisados por otro integrante.
- Commits frecuentes y repartidos (el historial se evalúa).
- Tablero de tareas con sprints cortos.
- GitHub Actions: lint, pruebas y compilación.
- ADRs breves en `/docs/adr` para: estado global, backend, pagos manuales, autenticación, ejecución local.
- **Revisión cruzada antes de la entrega:** cada persona explica su módulo a las otras dos y se practican preguntas de defensa (ubicar archivos, justificar decisiones, ajuste en vivo).

---

## 11. Orden de construcción

1. **Congelar decisiones** (este documento) y escribir los ADRs principales.
2. **Diseño:** diagrama ER, diagrama de arquitectura, contrato de API, wireframes y tokens de diseño accesibles.
3. **Setup:** repositorio, Docker Compose con PostgreSQL, Prisma, CI, variables de entorno, proyecto Expo.
4. **Autenticación y componentes base** (backend y app).
5. **Catálogo, grupos y membresías**, con confirmación de acceso.
6. **Cuotas, tareas programadas y notificaciones.**
7. **Calificaciones y reportes.**
8. **Pruebas, auditoría de accesibilidad en dispositivo y piloto.**
9. **Documento final, README y ensayo de la sustentación.**
10. *(Opcional)* Despliegue en internet si el tiempo lo permite.

---

## 12. README (contenido mínimo exigido)

- Descripción del proyecto y arquitectura.
- Requisitos previos (Node, Docker, Expo/EAS, emulador).
- Variables de entorno (con `.env.example` para `mobile` y `backend`).
- Cómo levantar la base de datos y el backend (`docker compose up`, migraciones y seed).
- Cómo ejecutar la app en emulador y en celular físico (incluyendo la URL de la API: `10.0.2.2`, `localhost` o IP local).
- Cuentas de prueba o datos semilla.
- Resumen de las características de accesibilidad implementadas.
- Cómo correr las pruebas.

---

## 13. Mapa hacia el documento final (5 secciones)

| Sección del enunciado | De dónde sale |
|---|---|
| 1. Visión, problema y estado del arte | Propuesta de la Fase 1, con la evolución del producto y la matriz competitiva ajustada (ya sin "pago protegido" como ventaja) |
| 2. Arquitectura e implementación | Secciones 2, 5, 6 y 7 de este documento |
| 3. Accesibilidad | Sección 8 y matriz trazable con evidencia |
| 4. Pruebas y validación | Sección 9 con resultados reales |
| 5. Conclusiones y trabajo futuro | Pasarela de pagos, pago retenido, verificación de identidad, subida de comprobantes, despliegue, alertas de cambios de política |

### 13.1 Diferenciadores a presentar (versión ajustada)

1. Gestión automática de cupos por grupo.
2. Seguimiento de cuotas con recordatorios y confirmación doble.
3. Protección al miembro: no se genera la primera cuota hasta confirmar acceso.
4. Guía de compatibilidad por servicio.
5. Reputación bidireccional con historial de pagos a tiempo.
6. Accesibilidad móvil como criterio de diseño.

### 13.2 Justificación del cambio de alcance (para la sección 1 y 5)

Documentar la investigación de comisiones, el riesgo de custodiar fondos y la limitación de tiempo, y presentar el pago manual como decisión consciente que reduce riesgo y permite validar el producto antes de integrar una pasarela. Se recomienda avisar al profesor del ajuste con un correo corto.

---

## 14. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Que el cambio de alcance se lea como incumplimiento de la Fase 1 | Media | Alto | Documentar la decisión y avisar al profesor |
| Fallo de red en la demo | Media | Alto | Emulador, URL de API configurable y grabación de respaldo |
| Un integrante no domina todo el código | Media | Alto | Reparto vertical y revisión cruzada |
| Scope creep | Alta | Medio | Alcance congelado: Must vs. Should vs. fuera del MVP |
| Accesibilidad dejada para el final | Media | Alto | Componentes base accesibles y matriz llenada durante el desarrollo |
| Políticas de las plataformas cambian | Media | Medio | Catálogo curado con fecha de revisión y responsable |
| Secretos en el historial de Git | Baja | Alto | `.gitignore`, `.env.example` y revisión antes de cada push |

---

## 15. Decisiones pendientes

- [ ] Confirmar con el profesor si basta ejecutar en local (el título de la fase menciona "despliegue").
- [ ] Confirmar que Redux Toolkit + RTK Query es la opción final de estado global.
- [ ] Elegir los servicios del catálogo inicial y verificar sus condiciones oficiales.
- [ ] Ratificar las reglas de la sección 4.4 (días de gracia, mora, ingreso a mitad de mes).
- [ ] Decidir si Google Sign-In entra o queda como futuro.
- [ ] Decidir si el comprobante será solo texto o imagen.
- [ ] Repartir los módulos verticales entre los integrantes.
- [ ] Decidir el modelo de ingresos para el trabajo futuro (por ejemplo, suscripción para administradores).
