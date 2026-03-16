# Coding Standards

## General (All Languages)

- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`
- **Branch naming**: `feat/TICKET-description`, `fix/TICKET-description`, `chore/description`
- **Line length**: 100 characters max
- **No commented-out code** in PRs
- **No `TODO` without ticket reference**: `// TODO(VEYOR-123): handle edge case`

---

## TypeScript / JavaScript (Veyor Frontend)

| Item | Standard |
|---|---|
| Formatter | Prettier (2-space indent, single quotes, trailing commas) |
| Linter | ESLint with `@next/eslint-plugin-next` |
| Types | Strict TypeScript; no `any` without justification comment |
| Imports | Absolute paths via `@/` alias |
| Components | Functional components only; no class components |
| Hooks | Custom hooks in `hooks/` directory |
| Error handling | Error boundaries for page-level errors |
| Testing | Jest + React Testing Library; Playwright for E2E |

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100
}
```

---

## Java 21 (Veyor Backend)

| Item | Standard |
|---|---|
| Formatter | Google Java Format |
| Linter | Checkstyle (Google rules) |
| Build | Gradle with Kotlin DSL |
| Records | Use Java records for DTOs |
| Optionals | Use `Optional` for nullable returns; never pass as params |
| Streams | Prefer streams over loops for collections |
| Exceptions | Domain exceptions extend `RuntimeException`; no checked exceptions |
| Logging | SLF4J + Logback; structured JSON format |
| Testing | JUnit 5 + Mockito; Testcontainers for integration |

---

## Python 3.11+ (BioMedical AI, Veyor Agents)

| Item | Standard |
|---|---|
| Formatter | `ruff format` (Black-compatible) |
| Linter | `ruff check` (replaces flake8 + isort + pycodestyle) |
| Type checker | `mypy --strict` |
| Imports | `isort` profile via ruff |
| Naming | `snake_case` for functions/variables; `PascalCase` for classes |
| Docstrings | Google-style |
| Error handling | Custom exception hierarchy; never bare `except:` |
| Testing | `pytest` with fixtures; `pytest-asyncio` for async |
| Dependencies | `pyproject.toml` (PEP 621); lock with `uv` |

```toml
# pyproject.toml [tool.ruff]
line-length = 100
target-version = "py311"
select = ["E", "F", "I", "N", "UP", "S", "B", "A", "C4", "SIM", "TCH"]
```

---

## Go 1.21+ (Veyor Quoting, Carrier Simulator)

| Item | Standard |
|---|---|
| Formatter | `gofmt` (enforced by CI) |
| Linter | `golangci-lint` with `.golangci.yml` config |
| Structure | Standard Go project layout (`cmd/`, `internal/`, `pkg/`) |
| Errors | Sentinel errors in `errors.go`; wrap with `fmt.Errorf("...: %w", err)` |
| Context | Pass `context.Context` as first parameter to all functions |
| Concurrency | Channels over mutexes; `errgroup` for fan-out |
| Testing | Table-driven tests; `testify` for assertions |
| Logging | `slog` structured logger |

```yaml
# .golangci.yml
linters:
  enable:
    - errcheck
    - govet
    - staticcheck
    - gosimple
    - ineffassign
    - unused
    - misspell
    - goimports
    - revive
```

---

## YAML / Helm / Kubernetes

| Item | Standard |
|---|---|
| Indentation | 2 spaces |
| Key ordering | `apiVersion`, `kind`, `metadata`, `spec` |
| Labels | Always include `app.kubernetes.io/name`, `app.kubernetes.io/part-of` |
| Resource limits | Always set `requests` and `limits` |
| Secrets | Never in manifests; use `ExternalSecret` or sealed secrets |

---

## Terraform / HCL

| Item | Standard |
|---|---|
| Formatter | `terraform fmt` |
| Linter | `tflint` |
| Naming | `snake_case` for resources; descriptive names |
| Modules | One resource type per module; composable |
| State | Remote state in S3 + DynamoDB lock |
| Variables | Always include `description` and `type` |
| Outputs | Expose only what consumers need |
