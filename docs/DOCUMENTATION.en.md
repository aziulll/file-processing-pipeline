# Project Documentation (EN)

## Purpose

This document describes how to run and evolve the **File Processing Pipeline** project for both local development and cloud deployment.

The repository is intentionally structured to run **two independent processes**:

- **API process**: handles HTTP requests (file ingestion)
- **Worker process**: consumes queue messages and processes files

---

## Quick Links

- Project description (EN): `../DESCRIPTION.en.md`
- Project description (PT-BR): `../DESCRIPTION.md`

---

## Current Implementation Status

The system is currently in a scaffold phase:

- API bootstrap and Worker bootstrap are implemented.
- Docker Compose includes PostgreSQL and LocalStack.
- API endpoints and file processing logic are not fully implemented yet.

---

## Prerequisites

- Docker + Docker Compose (recommended)
- Node.js 20+ (if running without Docker)

---

## Running with Docker Compose

From the repository root:

```bash
docker compose up --build
```

Services:

- API: http://localhost:3000
- PostgreSQL: localhost:5432
- LocalStack: http://localhost:4566

---

## Running Locally (without Docker)

Install dependencies and build:

```bash
npm ci
npm run build
```

Run the API process:

```bash
node dist/main.js api
```

Run the Worker process (in a separate terminal):

```bash
node dist/main.js worker
```

---

## Environment Variables

Docker Compose loads environment variables from an `.env` file (not committed).

Common variables:

- `PORT`: API port (default: 3000)
- `QUEUE`: worker queue selector (planned; must match the internal queue/module map)
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `AWS_DEFAULT_REGION` (LocalStack default region)

Planned variables (once AWS integration is implemented):

- `S3_BUCKET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (for LocalStack these are often dummy values)
- `AWS_ENDPOINT_URL` (LocalStack endpoint, e.g., `http://localstack:4566` inside Docker)

---

## API Documentation (Swagger) — Planned

Swagger is not configured yet, but the intended convention is:

- Swagger UI URL: `http://localhost:3000/api`

Implementation will likely add `@nestjs/swagger` and register Swagger in the API bootstrap.

---

## Planned Endpoints

Upload:

- `POST /files/upload` (CSV/JSON upload; persists metadata; enqueues processing)

Status:

- `GET /files/:id`
- `GET /files?status=&page=&limit=`

---

## LocalStack Notes

The current `docker-compose.yml` enables `s3` only. As the project evolves, LocalStack will be extended to include:

- `sqs`
- `sns`

---

## Development Conventions

- Prefer small modules with explicit responsibilities.
- Keep the API process stateless; persist state in PostgreSQL.
- Worker should be idempotent and safe to retry.
