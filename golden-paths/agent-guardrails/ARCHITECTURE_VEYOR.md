# Architecture Guardrails — Veyor Marketplace

## System Overview

Veyor is a freight SaaS marketplace connecting shippers with carriers. It uses a **hybrid microservices architecture** with a Java monolith core + Go microservices + a Python AI agent.

## Service Boundaries (Do NOT violate)

```
┌─────────────────────────────────────────────────────────────┐
│                Next.js Frontend (port 3000)                 │
│  Scope: UI rendering, API calls, client-side state          │
│  Boundary: MUST NOT contain business logic                  │
└────────────────────────────┬────────────────────────────────┘
                             │ REST / HTTP
┌────────────────────────────▼────────────────────────────────┐
│           Spring Boot Core API (port 8080)                  │
│  Modules: identity | booking | shipment | admin | notif     │
│  Boundary: ALL business logic lives here                    │
└─────────┬────────────────────────────────┬──────────────────┘
          │ gRPC                            │ Kafka
┌─────────▼──────────┐   ┌────────────────▼───────────────────┐
│  Go Quoting (50051) │   │    Go Carrier Simulator (8081)     │
│  Pure compute       │   │    Event-driven, stateless         │
└────────────────────┘   └────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│       AI Support Agent — FastAPI + LangChain (8000)         │
│  Boundary: Chat only, read-only access to booking data      │
└─────────────────────────────────────────────────────────────┘
```

## Module Rules

### Spring Boot Backend (`backend/`)
| Rule | Detail |
|---|---|
| Package structure | `com.veyor.marketplace.modules.{module}` |
| Cross-module calls | Via **service interfaces** only, never direct repository access |
| DTOs | Each module exposes its own DTO package; never share entities |
| Database | Each module owns its tables; no cross-module JOINs |
| Events | Cross-module communication via Spring Events or Kafka topics |
| Auth | JWT + RBAC via `identity` module; other modules use `@PreAuthorize` |

### Next.js Frontend (`frontend/`)
| Rule | Detail |
|---|---|
| Routing | App Router (`app/`) only; no Pages Router |
| State | Server Components by default; Client Components only when needed |
| API calls | Via `lib/api.ts` abstraction; never raw `fetch` in components |
| Styling | CSS Modules or Tailwind; no inline styles |
| Forms | React Hook Form + Zod validation |

### Go Microservices (`quoting-service/`, `carrier-simulator/`)
| Rule | Detail |
|---|---|
| Protocol | gRPC for quoting; REST for carrier simulator |
| Error handling | Return domain errors, not raw strings |
| Config | Environment variables via `envconfig` |
| Logging | Structured JSON logging via `slog` |

### AI Agent (`agents/`)
| Rule | Detail |
|---|---|
| Framework | LangChain ReAct agent |
| Tools | Read-only access to booking/shipment APIs |
| Tracing | Langsmith integration mandatory |
| LLM Gateway | MUST route all LLM requests through the LiteLLM Gateway (`http://litellm:4000`). Direct external API calls are prohibited. |
| Safety | No write operations; no direct DB access |

## API Contracts

- OpenAPI spec files MUST be maintained at `docs/api/openapi.yml`
- gRPC proto files at `quoting-service/proto/`
- Breaking changes require ADR at `docs/adr/`

## Data Flow Rules

1. **Writes** always go through Spring Boot → PostgreSQL
2. **Reads** can be cached in Redis (TTL ≤ 5min for pricing data)
3. **Events** flow via Kafka; consumers must be idempotent
4. **Quotes** are computed by Go service, never in Java backend
