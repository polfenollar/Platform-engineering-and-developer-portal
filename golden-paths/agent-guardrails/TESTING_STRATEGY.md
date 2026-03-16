# Testing Strategy

## Testing Pyramid

```
         ╱╲
        ╱ E2E ╲          ← Few, slow, high-value (critical user journeys)
       ╱────────╲
      ╱ Integration╲     ← Medium count (API contracts, DB, messaging)
     ╱──────────────╲
    ╱   Unit Tests    ╲   ← Many, fast, isolated (business logic)
   ╱────────────────────╲
  ╱    Load / Perf       ╲ ← Run on schedule (not per-PR)
 ╱────────────────────────╲
```

## Coverage Requirements

| Level | Minimum Coverage | Runs On | Max Duration |
|---|---|---|---|
| Unit | 80% line coverage | Every PR | < 3 min |
| Integration | Critical paths covered | Every PR | < 10 min |
| E2E | Top 5 user journeys | Merge to `main` | < 15 min |
| Load | SLA thresholds met | Weekly schedule | < 30 min |

---

## Unit Testing

### Per-Language Setup

**TypeScript (Jest + RTL)**
```bash
cd projects/veyor-marketplace/frontend && npm test -- --coverage
```
- Test components in isolation with `@testing-library/react`
- Mock API calls with `msw` (Mock Service Worker)
- Snapshot tests for stable UI components only

**Java (JUnit 5 + Mockito)**
```bash
cd projects/veyor-marketplace/backend && ./gradlew test
```
- Test service layer; mock repositories with `@MockBean`
- Use `@ParameterizedTest` for edge cases
- Test validation with `@Valid` annotations

**Python (pytest)**
```bash
cd projects/biomedical-ai && python -m pytest tests/unit/ -v --cov=src --cov-report=html
```
- Fixtures in `conftest.py`; avoid test pollution
- Use `pytest-mock` for mocking, `freezegun` for time
- Test agent tools individually with mocked LLM responses

**Go (testing + testify)**
```bash
cd projects/veyor-marketplace/quoting-service && go test ./... -v -race -cover
```
- Table-driven tests for all business logic
- `testify/assert` for assertions
- `httptest` for HTTP handler tests

---

## Integration Testing

| Test Type | Tool | Scope |
|---|---|---|
| Database | Testcontainers | PostgreSQL migrations, queries |
| API | REST Assured / httpx | Endpoint contracts |
| gRPC | grpc-testing | Quoting service proto compliance |
| Kafka | Testcontainers | Event production/consumption |
| Temporal | Temporal test server | Workflow correctness |

```bash
# Run all integration tests
cd projects/veyor-marketplace/backend && ./gradlew integrationTest
cd projects/biomedical-ai && python -m pytest tests/integration/ -v
```

---

## E2E Testing

**Tool**: Playwright (TypeScript)

```bash
cd projects/veyor-marketplace/frontend && npx playwright test
```

| Test | User Journey |
|---|---|
| `search-and-book.spec.ts` | Search route → compare quotes → book shipment |
| `tracking.spec.ts` | View shipment status → verify tracking updates |
| `admin-dashboard.spec.ts` | Login as admin → view analytics → manage users |
| `ai-chat.spec.ts` | Open chat → ask about shipment → verify response |
| `auth-flow.spec.ts` | Register → login → logout → password reset |

---

## Load Testing

**Tool**: k6

```bash
# Veyor API load test
k6 run --vus 50 --duration 5m platform/kubernetes/charts/veyor-backend/tests/load.js

# BioMedical search load test
k6 run --vus 20 --duration 5m platform/kubernetes/charts/biomedical-api/tests/load.js
```

### SLA Thresholds

| Metric | Veyor | BioMedical |
|---|---|---|
| p95 latency: search | < 2s | < 5s |
| p95 latency: booking | < 500ms | N/A |
| p95 latency: evidence query | N/A | < 10s |
| Error rate | < 0.1% | < 1% |
| Throughput | 500 RPS | 50 RPS |

---

## CI Integration

Tests are integrated into GitHub Actions workflows:

```
PR opened → lint → unit tests → integration tests → SAST scan → build
Merge to main → all above + E2E tests + deploy to dev
Weekly → load tests on staging
```

Each test type has a corresponding reusable workflow in `platform/github-actions/`.
