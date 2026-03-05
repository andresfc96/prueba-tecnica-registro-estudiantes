# Resultado prueba tecnica - aplicacion web

## Resumen de solucion

Se construyo una aplicacion cliente-servidor con:
- Backend en NestJS + Prisma.
- Base de datos MySQL preparada con Docker Compose.
- Frontend en React + Vite (interfaz minima y limpia).

La implementacion cumple los puntos funcionales del enunciado:
- CRUD de estudiantes.
- Inscripcion de materias con reglas de negocio.
- Consulta de registros de otros estudiantes.
- Visualizacion de companeros por cada clase.

## Reglas de negocio implementadas

- Existen 10 materias (seed).
- Cada materia vale 3 creditos.
- Cada estudiante puede seleccionar maximo 3 materias.
- Existen 5 profesores, cada uno asignado a 2 materias (seed).
- No se permite que un estudiante tome materias dictadas por el mismo profesor.

## Seguridad aplicada (sin JWT)

- `helmet` para cabeceras de seguridad.
- CORS restringido por variable de entorno (`FRONTEND_URL`).
- `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`.
- Rate limiting global con `@nestjs/throttler`.
- Errores de negocio y validacion con respuestas claras.

## Endpoints principales

- `GET /` healthcheck.
- `GET /api` Swagger.
- `POST /students` crear estudiante.
- `GET /students` listar estudiantes con materias.
- `GET /students/:id` obtener estudiante.
- `PATCH /students/:id` actualizar estudiante.
- `DELETE /students/:id` eliminar estudiante.
- `GET /subjects` listar materias y profesor.
- `GET /students/:studentId/enrollments` ver inscripcion.
- `PUT /students/:studentId/enrollments` reemplazar inscripcion.
- `GET /students/:id/classmates` ver companeros por materia.

## Estructura SQL entregada

En `backend/prisma/` se incluyen:
- `init.sql`: script SQL de creacion de tablas.
- `seed.sql`: insercion base de profesores y materias.

## Pruebas

- Unitarias (Jest):
  - Rechazo de mas de 3 materias.
  - Rechazo de materias con mismo profesor.
  - Rechazo de materias inexistentes.
  - Validacion de estudiante inexistente.
  - Flujo valido de actualizacion de inscripcion.
- E2E basica (Jest + Supertest):
  - Endpoint de salud `GET /`.

## Evidencia y notas

- La coleccion Postman la construyes tu usando Swagger en `/api`.
- Si Docker no esta disponible en tu entorno, solo necesitas levantarlo y ejecutar migraciones/seed segun README.
