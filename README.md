# Cuotix

App móvil para compartir costos de suscripciones. *Comparte tus suscripciones, paga solo tu cuota.*

## Estructura

```
cuotix/
├── src/               # App móvil (Expo + Expo Router): src/app, src/store, ...
├── __tests__/         # Tests móviles (jest-expo + React Native Testing Library)
├── backend/           # API (Node + Express + Prisma + PostgreSQL)
│   ├── prisma/        # schema.prisma y migraciones
│   ├── src/
│   └── tests/         # Jest + Supertest
├── docs/              # Especificaciones y decisiones
└── docker-compose.yml # API + PostgreSQL para desarrollo local
```

## Requisitos

- Node 22+
- PostgreSQL 17+ (local) **o** Docker

## Docker (solo CLI, sin Docker Desktop)

```bash
brew install docker docker-compose colima
colima start
docker-compose up --build      # API + PostgreSQL (usar `docker-compose`, con guion)
```

Si tienes PostgreSQL local en el puerto 5432, detenlo antes (`brew services stop postgresql@18`).

## Backend

```bash
cd backend
cp .env.example .env
npm install

# Opción A (recomendada): PostgreSQL con Docker, desde la raíz:
#   docker-compose up db -d     # crea las BD `cuotix` y `cuotix_test`
# Opción B: PostgreSQL local con rol `cuotix` (contraseña `cuotix`)
#   y las BD `cuotix` y `cuotix_test`.

npx prisma migrate dev     # aplica migraciones y genera el cliente
npm run dev                # http://localhost:3000/health
```

### Tests del backend

```bash
cd backend
npm run test:db:migrate    # aplica migraciones a cuotix_test
npm test
npm run typecheck
```

La configuración de test vive en `backend/.env.test`.

## Demo

```bash
cd backend
npm run db:reset-demo      # borra los datos y carga catálogo + datos de ejemplo (no corre con NODE_ENV=production)
npm run dev
```

Usuarios (contraseña `Test1234!`):

| Correo | Rol | Qué muestra |
|--------|-----|-------------|
| `owner@example.com` | administrador de 2 grupos | solicitud pendiente, miembro aprobado, cuota por confirmar, cuota atrasada |
| `member@example.com` | miembro activo | cuota ya marcada como pagada; administra el grupo de Netflix |
| `member2@example.com` | miembro activo | cuota atrasada y cuota vigente |
| `solicitante@example.com` | solicitud `PENDING` | esperando aprobación |
| `aprobado@example.com` | membresía `APPROVED` | puede confirmar acceso |
| `moderator@example.com` | `ADMIN` | puede listar reportes por API (`GET /reports`) |

Las fechas de las cuotas son relativas al día en que se ejecuta el reset. Para simular el paso del tiempo: `npm run jobs:run -- --date=2026-12-16`.

## API

La especificación OpenAPI está en [`docs/openapi.yaml`](docs/openapi.yaml) (puede abrirse en https://editor.swagger.io). Un test verifica que cubra todas las rutas del código.

## Móvil

```bash
npm install
npx expo start
```

Variable opcional: `EXPO_PUBLIC_API_URL` (por defecto `http://localhost:3000`, válido para el simulador de iOS). Según dónde corra la app:

| Dónde | Valor |
|-------|-------|
| Simulador de iOS | `http://localhost:3000` (por defecto) |
| Emulador de Android | `http://10.0.2.2:3000` (`localhost` sería el propio emulador) |
| Dispositivo físico | `http://<IP de tu máquina>:3000` (por ejemplo `ipconfig getifaddr en0` en macOS); el teléfono y el equipo deben estar en la misma red |

Ejemplo: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 npx expo start`.

Las notificaciones push requieren un build de desarrollo (no Expo Go) y un `projectId` de EAS.

```bash
npm test            # Jest
npx expo lint
npx tsc --noEmit
```

### Navegación

Cuatro pestañas: **Inicio** (mis grupos), **Explorar**, **Notificaciones** (con contador de no leídas) y **Perfil** (tema, alto contraste, vibración, editar perfil, cerrar sesión). Los ajustes se guardan en el dispositivo.

### Enlaces profundos

Esquema `cuotix://`. Al abrir un enlace, la pantalla queda sobre las pestañas (se puede volver). Una ruta desconocida muestra una pantalla con acceso al inicio. Requiere sesión iniciada.

| Enlace | Pantalla |
|--------|----------|
| `cuotix://notifications` | Notificaciones |
| `cuotix://groups/<id>` | Detalle del grupo |
| `cuotix://payments/<id>` | Detalle de la cuota |
| `cuotix://users/<id>` | Perfil y calificaciones |

Probar: `npx uri-scheme open "cuotix://notifications" --ios` (o `--android`).

## Docs

Ver `docs/IMPLEMENTATION_PHASES.md` para el orden de implementación.
