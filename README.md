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

## Móvil

```bash
npm install
npx expo start
```

```bash
npm test            # Jest
npx expo lint
npx tsc --noEmit
```

Variable opcional: `EXPO_PUBLIC_API_URL` (por defecto `http://localhost:3000`).

## Docs

Ver `docs/IMPLEMENTATION_PHASES.md` para el orden de implementación.
