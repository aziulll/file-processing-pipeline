# File Processing Pipeline (NestJS)

## Useful Links (EN / PT-BR)

- API Swagger (planned): http://localhost:3000/api
- Project description (PT-BR): [DESCRIPTION.md](DESCRIPTION.md)
- Project description (EN): [DESCRIPTION.en.md](DESCRIPTION.en.md)
- Project documentation (EN): [docs/DOCUMENTATION.en.md](docs/DOCUMENTATION.en.md)
- Project documentation (PT-BR): [docs/DOCUMENTATION.pt-BR.md](docs/DOCUMENTATION.pt-BR.md)

## Executive Summary

This repository contains a **file processing pipeline** implemented with **NestJS**, designed to demonstrate an **event-driven and asynchronous architecture** for ingesting files, persisting metadata, and processing content via background workers.

The solution is intended to be deployable to AWS (S3 + SNS/SQS + PostgreSQL) and runnable locally through Docker Compose using **PostgreSQL** and **LocalStack**.

> Note: The architecture and functional requirements are described in detail (Portuguese) in `DESCRIPTION.md`. This README is the formal English project documentation.

---

## Objective

The primary objective is to build an end-to-end pipeline that:

1. Accepts user file uploads through an API.
2. Stores uploaded files in object storage (S3).
3. Persists file metadata (e.g., size, type, storage key, status) in PostgreSQL.
4. Publishes an event to a queue/topic for asynchronous processing.
5. Processes the file content in a worker service and updates status accordingly.

This project emphasizes:

- Event-driven design (decoupling ingestion from processing)
- Reliable asynchronous execution (retries / DLQ)
- Clear separation of concerns (API vs worker processes)
- Cloud-ready design while remaining locally runnable

---

## Current State (What Is Already Built)

The project is currently in an **initial scaffold / work-in-progress** phase.

### Runtime and Process Model

- A single compiled entrypoint supports multiple process types:
  - `node dist/main.js api`
  - `node dist/main.js worker`
- A dedicated bootstrap exists for both processes:
  - API bootstrap starts an HTTP server.
  - Worker bootstrap starts a Nest application context based on a queue/module map.

### Dockerized Development Environment

- `docker-compose.yml` provides:
  - `api` container
  - `worker` container
  - `postgres` container
  - `localstack` container (currently configured with `SERVICES=s3`)
- `Dockerfile` builds a production-ready image (multi-stage build).

### API Module (Scaffold)

- A `files` controller exists with a POST endpoint stub.
- A service (`FileApiService`) returns a placeholder response indicating enqueue intent.

### Domain Skeleton

- A `FileStatus` enum exists, including: `PENDING`, `UPLOADED`, `PROCESSING`, `PROCESSED`, `FAILED`.

### Important Gaps (Known Incompleteness)

The following items are *present as placeholders* or are *not implemented yet*:

- Worker queue/module mapping is not wired to actual Nest modules.
- File domain module (`FileModule`) has no providers/controllers configured.
- No persistence layer (TypeORM / entities / migrations) is implemented yet.
- No AWS SDK integration (S3/SQS/SNS clients) is implemented yet.
- LocalStack is configured for S3 only; SNS/SQS are planned.
- Tests in `test/` are boilerplate and do not match the current module layout (e.g., references to an `AppModule` that does not exist).

---

## Target Architecture (What Will Be Built)

The intended architecture is an asynchronous pipeline:

1. **API** receives the file upload.
2. API uploads the file to **S3** (or LocalStack S3 locally).
3. API persists metadata to **PostgreSQL**.
4. API publishes an event to **SNS** (or equivalent) and/or sends a message to **SQS**.
5. **Worker** consumes the queue, downloads the file from S3, processes/validates it, and updates its status.
6. Failures trigger retries; exceeding retry limits sends messages to a **DLQ**.

---

## Functional Scope

### API Capabilities (Planned)

- Upload endpoint (e.g., `POST /files/upload`):
  - Accept CSV and JSON
  - Enforce size constraints (e.g., 10MB)
  - Upload to S3
  - Persist metadata
  - Publish event/message for asynchronous processing

- Status endpoints:
  - `GET /files/:id` to retrieve a file record and status
  - `GET /files` with filtering and pagination (e.g., by status)

### Worker Capabilities (Planned)

- Consume messages from SQS.
- Download file objects from S3.
- Validate and process content (validation and/or transformation).
- Update status in PostgreSQL.
- Ensure correct message deletion semantics (delete only on success).

---

## Technology Stack

- **Language/Runtime:** TypeScript / Node.js
- **Framework:** NestJS
- **Database:** PostgreSQL
- **Messaging:** AWS SNS + SQS (LocalStack in development)
- **Storage:** AWS S3 (LocalStack in development)
- **Containerization:** Docker / Docker Compose

---

## Local Development

### Prerequisites

- Docker + Docker Compose
- Node.js 20+ (optional, for running without Docker)

### Running with Docker Compose

```bash
docker compose up --build
```

Default ports:

- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- LocalStack: `http://localhost:4566`

### Running Locally (without Docker)

```bash
npm ci
npm run build
npm run start
```

Then choose a process type:

```bash
node dist/main.js api
node dist/main.js worker
```

---

## Configuration

Docker Compose expects an `.env` file (not committed). At minimum, you will typically define:

- `PORT` (API port)
- `QUEUE` (worker queue selector)
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `AWS_DEFAULT_REGION`
- (planned) S3 bucket name and AWS credentials for LocalStack/AWS

---

## Project Structure (High-Level)

- `src/main.ts`: multi-process entrypoint (`api` / `worker`)
- `src/bootstrap/*`: bootstraps for each process type
- `src/modules/file-api/*`: API-facing module (controllers/services)
- `src/modules/file/*`: worker/domain module (processing logic, repository abstraction)
- `src/constants/*`: queue names and worker module selection

---

## Roadmap

1. Implement the **file domain** (entity + repository + persistence) backed by PostgreSQL.
2. Implement **S3 upload/download** integration (AWS SDK; LocalStack compatible).
3. Implement **queue/topic publishing** (SNS/SQS) from the API after upload.
4. Implement the **worker consumer** (SQS polling/handler) and processing pipeline.
5. Add resilience features: retries, DLQ, visibility timeout configuration, structured logging.
6. Replace boilerplate tests with **API and worker e2e tests** aligned to the new modules.

---

## License

This repository is currently marked as `UNLICENSED` in `package.json`.
