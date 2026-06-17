# 🤖 AI Agent Master Instructions

> **Read this file first.** All AI developer agents working on this platform must follow these guardrails before writing any code.

## Agent Roles & Scoping

| Agent ID | Scope | Repository Scope | Guardrail File |
|---|---|---|---|
| `veyor-backend` | Spring Boot API (Java 21) | `projects/veyor-marketplace` | `ARCHITECTURE_VEYOR.md` |
| `veyor-frontend` | Next.js 14 frontend (TypeScript) | `projects/veyor-marketplace` | `ARCHITECTURE_VEYOR.md` |
| `veyor-go` | Go microservices (quoting, carrier) | `projects/veyor-marketplace` | `ARCHITECTURE_VEYOR.md` |
| `biomedical-core` | Python data pipelines & agents | `projects/biomedical-ai` | `ARCHITECTURE_BIOMEDICAL.md` |
| `biomedical-infra` | Temporal workflows, Docker, K8s | `projects/biomedical-ai` | `ARCHITECTURE_BIOMEDICAL.md` |
| `platform-ops` | Terraform, Argo, observability | `platform/`, `backstage-app/` | `INFRASTRUCTURE_GUARDRAILS.md` |

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

## IAM & PR Approval Boundaries

- 🔐 **Repository Isolation**: Agents are strictly bound to their target Repository Scope. They must not read from or write to directories/repositories outside of their designated scope.
- 🔑 **Credential Scoping**: All API keys, GitHub PATs, and cloud credentials used by agent runtimes must follow least-privilege principles (e.g., using GitHub Apps scoped to specific repositories instead of personal developer tokens).
- 🚫 **No Self-Merge / PR Approval**: AI agents are strictly prohibited from approving Pull Requests or merging code. Every agent PR must be reviewed and approved by a human developer.
- 👥 **CODEOWNERS Enforcement**: Critical system files (such as Helm charts under `platform/kubernetes/charts/`, Terraform manifests, and security policies) require approval from the `platform-ops` human team.

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

