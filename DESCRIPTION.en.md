## 1. Overview

This project demonstrates the development of an **asynchronous file processing system** using **NestJS**, integrated with AWS services (SNS, SQS, and S3).

Its purpose is to demonstrate practical knowledge in:
- Asynchronous processing with managed queues
- Event-driven architecture
- Integration with AWS services
- Separation of responsibilities
- Cloud best practices

---

## 2. Solution Description

The system supports file uploads that are stored in **S3** and processed asynchronously through **SNS/SQS**, with dedicated workers consuming messages and updating the processing status.

### Example Use Cases

- Report processing
- Batch data import
- Validation of user-submitted files

---

## 3. Implemented / Planned Features

> Note: This repository is being developed incrementally. Some items below represent the target scope and may still be under implementation.

### 3.1 File Upload

**Endpoint:** `POST /files/upload`

The API should:
- Accept files in CSV or JSON format
- Validate a maximum size (e.g., 10MB)
- Upload the file to **S3**
- Persist metadata in the database
- Publish an event to **SNS** to trigger processing

**Persisted metadata:**
- Unique ID
- Original filename
- S3 URL/key
- File type
- Processing status
- Timestamps (created/updated)

---

### 3.2 Processing Flow

**Possible states:**
- `PENDING` — File received, waiting to be processed
- `PROCESSING` — File being processed
- `COMPLETED` — Processing completed successfully
- `FAILED` — Processing failed

**Flow:**
1. Upload via API → stored in S3
2. API publishes a message to SNS
3. SNS forwards to SQS
4. Worker consumes the SQS message
5. Worker downloads file from S3
6. Worker processes and validates the content
7. Worker updates status in the database

---

### 3.3 Workers

Workers should:
- Consume messages from **SQS**
- Download files from **S3** using the received key
- Process the content (validation, transformation)
- Update the status in the database
- Rely on SQS retry behavior
- Delete messages only after successful processing

**SQS configuration (target):**
- Appropriate visibility timeout
- Dead Letter Queue (DLQ) enabled
- Max receive count configured

---

### 3.4 Status Queries

**Endpoints (target):**

- `GET /files/:id` — Retrieve a specific file record
- `GET /files` — List files with filters
  - Query params: `status`, `page`, `limit`
  - Pagination

---

## 4. Technical Architecture

### 4.1 Technology Stack

- **Runtime:** Node.js
- **Framework:** NestJS
- **Database:** PostgreSQL
- **Storage:** AWS S3
- **Messaging:** AWS SNS + SQS
- **Containerization:** Docker / Docker Compose
- **ORM:** TypeORM

---

### 4.2 Architecture Components

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────┐
│   API (NestJS)  │─────▶│   S3     │
└────────┬────────┘      └──────────┘
         │
         │ publishes
         ▼
    ┌────────┐
    │  SNS   │
    └────┬───┘
         │
         │ forwards
         ▼
    ┌────────┐
    │  SQS   │
    └────┬───┘
         │
         │ consumed by
         ▼
┌─────────────────┐      ┌──────────────┐
│ Worker (NestJS) │◀────▶│  PostgreSQL  │
└─────────────────┘      └──────────────┘
```

---

### 4.3 Data Model

**Entity: File**

```typescript
{
  id: string (UUID)
  originalName: string
  s3Key: string
  s3Bucket: string
  fileType: string
  fileSize: number
  status: enum (PENDING, PROCESSING, COMPLETED, FAILED)
  errorMessage?: string
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

---

## 5. AWS Integrations

### 5.1 S3 (Storage)

- Upload files via AWS SDK
- Generate unique keys (e.g., `uploads/{uuid}/{filename}`)
- Private bucket configuration
- Optional pre-signed URLs for download

### 5.2 SNS (Notifications)

- Topic: `file-processing`
- Publish after successful upload
- Payload includes: `fileId`, `s3Key`, `s3Bucket`

### 5.3 SQS (Queue)

- Main queue: `file-processing-queue`
- DLQ: `file-processing-dlq`
- Target settings:
  - Visibility timeout: 300s
  - Retention period: 4 days
  - Max receives: 3

---

## 6. Error Handling

### 6.1 Retry Strategy

- **Native SQS retries:** up to the configured max receives
- **Backoff:** configurable delay between attempts
- **DLQ:** failed messages are moved to the DLQ after exceeding retry limits

### 6.2 Logging

- Structured logging (JSON)
