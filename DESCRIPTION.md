## 1. Visão Geral

Este projeto demonstra o desenvolvimento de um **sistema de processamento assíncrono de arquivos** utilizando **NestJS** integrado com serviços AWS (SNS, SQS e S3).

O objetivo é apresentar conhecimento prático em:
- Processamento assíncrono com filas gerenciadas
- Arquitetura orientada a eventos
- Integração com serviços AWS
- Separação de responsabilidades
- Boas práticas em ambientes cloud

---

## 2. Descrição da Solução

O sistema permite o upload de arquivos, que são armazenados no **S3** e processados de forma assíncrona através de **SNS/SQS**, com workers dedicados consumindo as mensagens e atualizando o status do processamento.

### Cenários de Aplicação:
- Processamento de relatórios
- Importação de dados em lote
- Validação de arquivos enviados por usuários

---

## 3. Funcionalidades Implementadas

### 3.1 Upload de Arquivos

**Endpoint:** `POST /files/upload`

A API deve:
- Aceitar arquivos nos formatos CSV ou JSON
- Validar tamanho máximo (ex: 10MB)
- Fazer upload do arquivo para o **S3**
- Persistir metadados no banco de dados
- Publicar evento no **SNS** para processamento

**Metadados persistidos:**
- ID único
- Nome original do arquivo
- URL/chave do S3
- Tipo do arquivo
- Status do processamento
- Timestamps (criação/atualização)

---

### 3.2 Fluxo de Processamento

**Estados possíveis:**
- `PENDING` — Arquivo recebido, aguardando processamento
- `PROCESSING` — Arquivo sendo processado
- `COMPLETED` — Processamento concluído com sucesso
- `FAILED` — Falha durante o processamento

**Fluxo:**
1. Upload via API → armazenamento no S3
2. API publica mensagem no SNS
3. SNS encaminha para SQS
4. Worker consome mensagem do SQS
5. Worker baixa arquivo do S3
6. Worker processa e valida o conteúdo
7. Worker atualiza status no banco de dados

---

### 3.3 Workers

Os workers devem:
- Consumir mensagens do **SQS**
- Baixar arquivos do **S3** usando a chave recebida
- Processar o conteúdo (validação, transformação)
- Atualizar o status no banco de dados
- Implementar retry automático (via SQS)
- Deletar mensagem apenas após sucesso

**Configuração SQS:**
- Visibility timeout adequado
- Dead Letter Queue (DLQ) configurada
- Máximo de tentativas definido

---

### 3.4 Consulta de Status

**Endpoints disponíveis:**

`GET /files/:id` — Buscar arquivo específico

`GET /files` — Listar arquivos com filtros
- Query params: `status`, `page`, `limit`
- Paginação implementada

---

## 4. Arquitetura Técnica

### 4.1 Stack Tecnológica

- **Runtime:** Node.js
- **Framework:** NestJS
- **Banco de dados:** PostgreSQL
- **Armazenamento:** AWS S3
- **Mensageria:** AWS SNS + SQS
- **Containerização:** Docker / Docker Compose
- **ORM:** TypeORM

---

### 4.2 Componentes da Arquitetura

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────┐
│   API (NestJS)  │─────▶│   S3     │
└────────┬────────┘      └──────────┘
         │
         │ publica
         ▼
    ┌────────┐
    │  SNS   │
    └────┬───┘
         │
         │ encaminha
         ▼
    ┌────────┐
    │  SQS   │
    └────┬───┘
         │
         │ consome
         ▼
┌─────────────────┐      ┌──────────────┐
│ Worker (NestJS) │◀────▶│  PostgreSQL  │
└─────────────────┘      └──────────────┘
```
---

### 4.4 Modelo de Dados

**Entidade: File**

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

## 5. Integrações AWS

### 5.1 S3 (Armazenamento)

- Upload de arquivos via AWS SDK
- Geração de chaves únicas (ex: `uploads/{uuid}/{filename}`)
- Configuração de bucket privado
- URLs pré-assinadas para download (opcional)

### 5.2 SNS (Notificação)

- Tópico: `file-processing`
- Publicação após upload bem-sucedido
- Payload contém: fileId, s3Key, s3Bucket

### 5.3 SQS (Fila)

- Fila principal: `file-processing-queue`
- DLQ: `file-processing-dlq`
- Configurações:
  - Visibility timeout: 300s
  - Message retention: 4 dias
  - Max receives: 3

---

## 6. Tratamento de Erros

### 6.1 Retry Strategy

- **SQS nativo:** Até 3 tentativas automáticas
- **Backoff:** Delay entre tentativas configurável
- **DLQ:** Mensagens falhas vão para DLQ após máximo de tentativas

### 6.2 Logging

- Logs estruturados (JSON)
- Níveis: error, warn, info, debug
- Contexto incluído: fileId, s3Key, tentativa

### 6.3 Persistência de Falhas

- Status `FAILED` atualizado no banco
- Campo `errorMessage` preenchido
- Timestamp da falha registrado

---

## 7. Requisitos Não Funcionais

### 7.1 Escalabilidade

- API stateless, pode escalar horizontalmente
- Workers podem rodar múltiplas instâncias
- SQS gerencia distribuição de mensagens

### 7.2 Segurança

- Credenciais AWS via variáveis de ambiente
- Bucket S3 privado
- Validação de tipos de arquivo
- Sanitização de nomes de arquivo

### 7.3 Observabilidade

- Health check endpoint: `GET /health`
- Logs de cada etapa do processamento
- Métricas básicas (opcional): tempo de processamento, taxa de erro

---

## 8. Configuração e Execução

### 8.1 Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fileprocessing

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=file-processing-bucket
AWS_SNS_TOPIC_ARN=arn:aws:sns:region:account:file-processing
AWS_SQS_QUEUE_URL=https://sqs.region.amazonaws.com/account/file-processing-queue

# Application
PORT=3000
NODE_ENV=development
```

### 8.2 Docker Compose

Deve incluir:
- Container da API
- Container do Worker
- PostgreSQL
- LocalStack

---

## 9. Diferenciais Implementados

- [ ] Dead Letter Queue configurada
- [ ] Idempotência no processamento
- [ ] URLs pré-assinadas do S3
- [ ] Processamento em chunks para arquivos grandes
- [ ] Webhook de notificação ao concluir
- [ ] Métricas com CloudWatch (ou similar)
- [ ] Testes unitários e de integração

---
