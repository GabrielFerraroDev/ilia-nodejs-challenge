# ília - NodeJS Challenge

Production-grade financial application with two microservices: **Wallet Service** and **Users Service**, built with **Clean Architecture**, **SOLID principles**, and **TypeScript**.

## Quick Start

> **Only requirement:** [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed.

```bash
git clone <repo-url> && cd iliaTest
docker-compose up --build
```

That's it. Wait for the containers to become healthy (~30s), then test:

```bash
# Health check
curl http://localhost:3001/health   # → {"status":"ok","service":"wallet-service"}
curl http://localhost:3002/health   # → {"status":"ok","service":"users-service"}
```

### What `docker-compose up` starts

| Container          | Port  | Description                          |
|--------------------|-------|--------------------------------------|
| **wallet-db**      | 5432  | PostgreSQL for wallet data           |
| **users-db**       | 5433  | PostgreSQL for user data             |
| **rabbitmq**       | 5672  | AMQP broker (management UI: 15672)   |
| **wallet-service** | 3001  | HTTP API + RabbitMQ consumer         |
| **users-service**  | 3002  | HTTP API + RabbitMQ producer         |

## Try It Out

```bash
# 1. Register
curl -s -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"123456"}'

# 2. Login (saves refresh token cookie)
curl -s -c cookies.txt -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'
# → {"accessToken":"eyJ...","user":{...}}

# 3. Deposit (replace <TOKEN> with the accessToken from step 2)
curl -s -X POST http://localhost:3002/api/users/me/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"type":"DEPOSIT","amount":100.50,"description":"Initial deposit"}'

# 4. Check balance
curl -s http://localhost:3002/api/users/me/balance \
  -H "Authorization: Bearer <TOKEN>"
# → {"userId":"...","balance":100.5}

# 5. Withdraw
curl -s -X POST http://localhost:3002/api/users/me/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"type":"WITHDRAWAL","amount":30.00,"description":"ATM withdrawal"}'

# 6. List transactions
curl -s http://localhost:3002/api/users/me/transactions \
  -H "Authorization: Bearer <TOKEN>"

# 7. Refresh access token (uses HTTP-only cookie)
curl -s -b cookies.txt -X POST http://localhost:3002/api/auth/refresh

# 8. Logout
curl -s -b cookies.txt -X POST http://localhost:3002/api/auth/logout
```

## Architecture

Each service follows **Clean Architecture** with NestJS modules. Every domain module is split into three layers:

```
src/
├── main.ts                  # Bootstrap (HTTP + optional RMQ microservice)
├── app.module.ts            # Root module
├── health.controller.ts     # GET /health
├── prisma/                  # PrismaService (global)
├── common/                  # Shared filters, guards, errors
└── <module>/                # e.g. transaction/, auth/, user/
    ├── domain/              # Entities + repository interfaces (no framework deps)
    │   ├── entities/
    │   └── interfaces/repositories/
    ├── application/         # Use cases + DTOs (business logic)
    │   ├── dto/
    │   └── use-cases/       # One class per use case, single execute() method
    ├── infra/               # Framework-bound implementations
    │   ├── controllers/     # HTTP / RabbitMQ controllers
    │   ├── repositories/    # Prisma repository implementations
    │   └── strategies/      # Passport strategies (auth only)
    └── <module>.module.ts   # NestJS module wiring (interface → impl via DI)
```

### Dependency Inversion

Use cases depend on **abstract repository classes** (domain layer), never on Prisma directly. The NestJS module wires the concrete implementation at startup:

```typescript
// transaction.module.ts
{ provide: ITransactionRepository, useClass: TransactionRepository }
```

This means you can swap Prisma for any other data source without touching business logic.

### SOLID Principles

- **S** — One use case per class (`CreateTransactionUseCase`, `LoginUseCase`, etc.)
- **O** — Repositories are open for extension via abstract interfaces
- **L** — All implementations are substitutable through their abstract classes
- **I** — Granular repository interfaces per domain concept
- **D** — Use cases depend on abstractions, not concrete Prisma implementations

## Tech Stack

| Category       | Technology                                                  |
|----------------|-------------------------------------------------------------|
| **Runtime**    | Node.js 20, TypeScript 5                                    |
| **Framework**  | NestJS 10 (Express adapter)                                 |
| **Database**   | PostgreSQL 16, Prisma ORM                                   |
| **Messaging**  | RabbitMQ via `@nestjs/microservices` (RPC pattern)          |
| **Auth**       | JWT (15min) + refresh token (7 days, HTTP-only cookie)      |
| **Validation** | `class-validator` + `class-transformer` (NestJS pipes)      |
| **Containers** | Docker + Docker Compose                                     |
| **DI**         | NestJS IoC with interface-based custom providers            |

## API Reference

### Wallet Service — `localhost:3001`

| Method | Endpoint               | Auth     | Description              |
|--------|------------------------|----------|--------------------------|
| GET    | /health                | —        | Health check             |
| POST   | /api/transactions      | JWT      | Create transaction       |
| GET    | /api/transactions      | JWT      | List transactions        |
| GET    | /api/transactions/:id  | JWT      | Get transaction by ID    |
| GET    | /api/balance           | JWT      | Get current balance      |
| POST   | /internal/transactions | Internal | Create transaction (S2S) |
| GET    | /internal/transactions | Internal | List transactions (S2S)  |
| GET    | /internal/balance      | Internal | Get balance (S2S)        |

**RabbitMQ patterns** (consumed by wallet service): `wallet.create_transaction`, `wallet.get_balance`, `wallet.list_transactions`, `wallet.get_transaction`

### Users Service — `localhost:3002`

| Method | Endpoint                   | Auth | Description                         |
|--------|----------------------------|------|-------------------------------------|
| GET    | /health                    | —    | Health check                        |
| POST   | /api/auth/register         | —    | Register new user                   |
| POST   | /api/auth/login            | —    | Login (returns JWT + cookie)        |
| POST   | /api/auth/refresh          | —    | Refresh access token (uses cookie)  |
| POST   | /api/auth/logout           | —    | Logout (revokes refresh token)      |
| GET    | /api/users/me              | JWT  | Get profile                         |
| PUT    | /api/users/me              | JWT  | Update profile                      |
| DELETE | /api/users/me              | JWT  | Delete account                      |
| GET    | /api/users/me/balance      | JWT  | Get wallet balance (via RabbitMQ)   |
| POST   | /api/users/me/transactions | JWT  | Create transaction (via RabbitMQ)   |
| GET    | /api/users/me/transactions | JWT  | List transactions (via RabbitMQ)    |

## Database Design (3NF)

### Wallet Service

- **transactions** — `id` (UUID PK), `user_id`, `type` (DEPOSIT/WITHDRAWAL), `amount` (Decimal 12,2), `description`, `idempotency_key` (unique), `created_at`
- **ledger_entries** — `id` (auto-increment PK), `transaction_id` (FK unique), `user_id`, `type`, `amount`, `running_balance`, `created_at`
- **idempotency_records** — `id` (UUID PK), `key` (unique), `user_id`, `response_body`, `status_code`, `created_at`, `expires_at`

### Users Service

- **users** — `id` (UUID PK), `name`, `email` (unique), `password` (bcrypt), `created_at`, `updated_at`
- **refresh_tokens** — `id` (UUID PK), `token` (unique), `user_id` (FK), `expires_at`, `created_at`, `revoked_at`

## Transaction Safety

Financial operations use multiple safety mechanisms:

1. **Serializable isolation** — Prisma `$transaction` with `Serializable` isolation level
2. **Row-level lock** — `SELECT ... FOR UPDATE` on the latest ledger entry prevents concurrent balance reads
3. **Atomic ledger** — Transaction + ledger entry created in a single DB transaction
4. **Idempotency** — `Idempotency-Key` header prevents duplicate transactions (24h TTL)
5. **Running balance** — Each ledger entry stores the computed balance, enabling O(1) balance queries
6. **Serialization retry** — Automatic retry (3 attempts with jitter) on Postgres serialization conflicts (`P2034`)

## Inter-Service Communication

Services communicate via **RabbitMQ RPC** (request-reply pattern) instead of REST:

1. **Users Service** sends a message to a named queue (e.g., `wallet.create_transaction`)
2. **Wallet Service** consumes, processes, and replies
3. **Users Service** receives the response and returns it to the HTTP client

Benefits: **decoupling** (no URL knowledge), **resilience** (persistent queues), **scalability** (multiple consumers)

## Observability

Both services include structured logging, metrics, and request tracing out of the box.

### Structured Logging (Pino)

- **JSON logs** in production, **pretty-printed** in development
- Every HTTP request automatically logged with method, URL, status, and latency
- Sensitive headers (`Authorization`, `Cookie`, `Set-Cookie`) are **redacted** from logs
- Configurable via `LOG_LEVEL` env var (`debug`, `info`, `warn`, `error`)

### Prometheus Metrics

Each service exposes a `GET /metrics` endpoint with default Node.js process metrics:

```bash
curl http://localhost:3001/metrics   # wallet-service
curl http://localhost:3002/metrics   # users-service
```

Metrics include: HTTP request duration, heap usage, event loop lag, active handles, GC stats. Ready for Grafana/Alertmanager scraping.

### Request Correlation IDs

- Every request gets a unique `reqId` (UUID) logged on every line
- Pass `X-Correlation-Id` header to trace a request across both services via RabbitMQ
- If no header is provided, a UUID is auto-generated

## Local Development

```bash
# 1. Start only infrastructure
docker-compose up wallet-db users-db rabbitmq -d

# 2. Wallet service
cd wallet-service
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev

# 3. Users service (new terminal)
cd users-service
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev
```

## Environment Variables

| Variable             | Service | Description                             |
|----------------------|---------|-----------------------------------------|
| `PORT`               | Both    | Server port (default: 3001 / 3002)      |
| `JWT_SECRET`         | Both    | JWT access token signing key            |
| `JWT_INTERNAL_SECRET`| Wallet  | JWT signing key for S2S internal routes |
| `DATABASE_URL`       | Both    | PostgreSQL connection string            |
| `RABBITMQ_URL`       | Both    | RabbitMQ connection string              |

> All secrets are injected via environment variables. Docker Compose provides sensible defaults for local development.

## Requirements Checklist

| Requirement | Implementation |
|---|---|
| Two microservices (wallet + users) | `wallet-service/` and `users-service/`, separate codebases and DBs |
| Clean Architecture + SOLID | Domain → Application → Infra layers per module, DI via abstract classes |
| TypeScript + NestJS | TS 5, NestJS 10, strict mode |
| PostgreSQL + Prisma ORM | Separate Postgres per service, Prisma migrations and client |
| Inter-service communication | RabbitMQ RPC (request/reply) via `@nestjs/microservices` |
| JWT authentication | Access token (15min) + refresh token (7d, HTTP-only cookie, SHA-256 hashed) |
| Internal service auth | Separate `JWT_INTERNAL_SECRET` + `InternalAuthGuard` |
| Transaction safety | Serializable isolation + `FOR UPDATE` lock + atomic ledger + retry with jitter |
| Idempotency | `Idempotency-Key` header + DB unique constraint + 24h TTL records |
| Decimal money handling | `Decimal(12,2)` in Prisma schema, `Number()` conversions in domain |
| Unit tests | 33 tests (14 wallet + 19 users) covering all use cases |
| E2E tests | 31 tests (17 wallet + 14 users) against real Postgres |
| CI/CD pipeline | GitHub Actions: lint → build → unit → e2e with ephemeral Postgres |
| Docker Compose | One-command local setup: 2 DBs + RabbitMQ + 2 services |
| Observability | Pino structured logging + Prometheus `/metrics` + correlation IDs |
| Security | Bcrypt passwords, SHA-256 hashed refresh tokens, sensitive header redaction |
