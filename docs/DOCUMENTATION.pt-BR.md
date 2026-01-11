# Documentação do Projeto (PT-BR)

## Propósito

Este documento descreve como executar e evoluir o projeto **File Processing Pipeline** tanto para desenvolvimento local quanto para futura implantação em cloud.

O repositório foi estruturado para executar **dois processos independentes**:

- **Processo API**: recebe requisições HTTP (ingestão/upload)
- **Processo Worker**: consome mensagens da fila e processa arquivos

---

## Links Rápidos

- Descrição do projeto (PT-BR): `../DESCRIPTION.md`
- Descrição do projeto (EN): `../DESCRIPTION.en.md`

---

## Status Atual da Implementação

O sistema está em fase de scaffold (base inicial):

- Bootstraps de API e Worker implementados.
- Docker Compose com PostgreSQL e LocalStack.
- Endpoints finais e lógica de processamento ainda não estão implementados por completo.

---

## Pré-requisitos

- Docker + Docker Compose (recomendado)
- Node.js 20+ (caso rode sem Docker)

---

## Executando com Docker Compose

Na raiz do repositório:

```bash
docker compose up --build
```

Serviços:

- API: http://localhost:3000
- PostgreSQL: localhost:5432
- LocalStack: http://localhost:4566

---

## Executando Localmente (sem Docker)

Instale dependências e faça build:

```bash
npm ci
npm run build
```

Suba o processo de API:

```bash
node dist/main.js api
```

Suba o processo de Worker (em outro terminal):

```bash
node dist/main.js worker
```

---

## Variáveis de Ambiente

O Docker Compose carrega variáveis via arquivo `.env` (não versionado).

Variáveis comuns:

- `PORT`: porta da API (padrão: 3000)
- `QUEUE`: seletor de fila do worker (planejado; deve bater com o mapa interno de fila/módulo)
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `AWS_DEFAULT_REGION` (região padrão no LocalStack)

Variáveis planejadas (quando a integração AWS estiver pronta):

- `S3_BUCKET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (no LocalStack geralmente podem ser valores dummy)
- `AWS_ENDPOINT_URL` (endpoint do LocalStack, ex.: `http://localstack:4566` dentro do Docker)

---

## Documentação da API (Swagger) — Planejado

O Swagger ainda não está configurado, mas o padrão pretendido é:

- Swagger UI: `http://localhost:3000/api`

Provavelmente será adicionado `@nestjs/swagger` e registrado no bootstrap da API.

---

## Endpoints Planejados

Upload:

- `POST /files/upload` (upload CSV/JSON; persiste metadados; enfileira processamento)

Consulta de status:

- `GET /files/:id`
- `GET /files?status=&page=&limit=`

---

## Observações sobre LocalStack

No `docker-compose.yml`, o LocalStack está habilitado apenas com `s3`. Conforme a evolução do projeto, será expandido para incluir:

- `sqs`
- `sns`

---

## Convenções de Desenvolvimento

- Preferir módulos pequenos e com responsabilidade clara.
- Manter a API stateless; persistir estado no PostgreSQL.
- Worker deve ser idempotente e seguro para retry.
