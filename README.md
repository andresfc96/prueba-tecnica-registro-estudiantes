# Prueba Tecnica - Registro de Estudiantes

Implementacion full stack con foco en backend:
- `backend`: NestJS + Prisma + MySQL.
- `frontend`: React + Vite (UI basica y limpia).
- `docker-compose.yml`: MySQL local.

## Requisitos

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## 1) Base de datos

Desde la raiz:

```bash
docker compose up -d
```

## 2) Backend

```bash
cd backend
cp .env .env.local 2>/dev/null || true
npm install --cache ./.npm-cache
npm run prisma:generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

Backend:
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`

## 3) Frontend

En otra terminal:

```bash
cd frontend
npm install --cache ./.npm-cache
echo 'VITE_API_URL="http://localhost:3000"' > .env
npm run dev
```

Frontend:
- `http://localhost:5173`

## Scripts SQL alternos

Si prefieres SQL manual:
- Estructura: `backend/prisma/init.sql`
- Seed: `backend/prisma/seed.sql`
