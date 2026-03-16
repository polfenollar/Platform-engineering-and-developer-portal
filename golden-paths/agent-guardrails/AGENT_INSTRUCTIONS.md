# 🤖 AI Agent Master Instructions

> **Read this file first.** All AI developer agents working on this platform must follow these guardrails before writing any code.

## Agent Roles

| Agent ID | Scope | Guardrail File |
|---|---|---|
| `veyor-backend` | Spring Boot API (Java 21) | `ARCHITECTURE_VEYOR.md` |
| `veyor-frontend` | Next.js 14 frontend (TypeScript) | `ARCHITECTURE_VEYOR.md` |
| `veyor-go` | Go microservices (quoting, carrier) | `ARCHITECTURE_VEYOR.md` |
| `biomedical-core` | Python data pipelines & agents | `ARCHITECTURE_BIOMEDICAL.md` |
| `biomedical-infra` | Temporal workflows, Docker, K8s | `ARCHITECTURE_BIOMEDICAL.md` |
| `platform-ops` | Terraform, Argo, observability | `INFRASTRUCTURE_GUARDRAILS.md` |

## Mandatory Workflow (every task)

1. **Read** the relevant `ARCHITECTURE_*.md` for your scope
2. **Read** `CODING_STANDARDS.md` for your language
3. **Read** `TESTING_STRATEGY.md` — every PR must include tests
4. **Read** `SECURITY_GUARDRAILS.md` — apply before pushing
5. **Create branch** from `main` using `feat/`, `fix/`, `chore/` prefixes
6. **Write code** following the architecture and coding standards
7. **Run tests** locally: `make test-unit` minimum
8. **Run linters**: `make lint`
9. **Run security scan**: `make scan`
10. **Open PR** using `PR_CHECKLIST.md` template
11. **Wait for CI** — all checks must pass before merge

## Golden Rules

- ❌ **Never bypass** deployment protection rules
- ❌ **Never commit** secrets, API keys, or credentials
- ❌ **Never skip** tests — every feature needs unit + integration tests
- ❌ **Never modify** shared infrastructure without platform-ops review
- ✅ **Always** use conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- ✅ **Always** add observability (metrics, traces, logs) to new services
- ✅ **Always** write idempotent, retry-safe code
- ✅ **Always** use the provided Helm chart templates for new services

## File Dependencies

```
AGENT_INSTRUCTIONS.md (you are here)
├── ARCHITECTURE_VEYOR.md         — Veyor module boundaries, APIs
├── ARCHITECTURE_BIOMEDICAL.md    — BioMedical data flow, agent patterns
├── CODING_STANDARDS.md           — Language-specific conventions
├── TESTING_STRATEGY.md           — Testing pyramid requirements
├── SECURITY_GUARDRAILS.md        — OWASP, secrets, scanning rules
├── INFRASTRUCTURE_GUARDRAILS.md  — Terraform, K8s, namespace strategy
└── PR_CHECKLIST.md               — Pre-merge validation checklist
```
