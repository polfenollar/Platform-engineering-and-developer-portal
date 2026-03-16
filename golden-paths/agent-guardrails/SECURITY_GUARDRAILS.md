# Security Guardrails

## Secrets Management

| Rule | Detail |
|---|---|
| **No hardcoded secrets** | Never commit API keys, passwords, tokens, or credentials |
| **Environment variables** | All secrets via env vars; `.env.example` files for documentation |
| **.gitignore** | `.env`, `.env.local`, `*.pem`, `*.key`, `*.tfvars` must be in `.gitignore` |
| **CI/CD secrets** | GitHub Actions secrets or sealed secrets in K8s |
| **Rotation** | Secrets must have rotation procedures documented |

## Dependency Security

| Tool | Scope | Frequency |
|---|---|---|
| `npm audit` | Node.js dependencies | Every PR |
| `pip-audit` | Python dependencies | Every PR |
| `./gradlew dependencyCheckAnalyze` | Java dependencies | Every PR |
| Dependabot / Renovate | Auto-update PRs | Weekly |

## SAST Scanning

### Semgrep (primary)
```bash
semgrep scan --config auto --error projects/
```
Rules: OWASP Top 10, injection, auth bypass, XSS, SSRF

### CodeQL (GitHub-native)
- Enabled via GitHub Actions for `java`, `javascript`, `python`, `go`
- Runs on every PR targeting `main`
- Block merge on HIGH/CRITICAL findings

## OWASP Compliance Checklist

| # | Risk | Mitigation |
|---|---|---|
| A01 | Broken Access Control | RBAC via Spring Security; `@PreAuthorize` on all endpoints |
| A02 | Cryptographic Failures | TLS everywhere; bcrypt for passwords; no MD5/SHA1 |
| A03 | Injection | Parameterized queries (JPA); input validation (Zod, @Valid) |
| A04 | Insecure Design | Architecture guardrails; threat modeling per feature |
| A05 | Security Misconfiguration | Helm values validated; no default credentials |
| A06 | Vulnerable Components | Dependency scanning in CI |
| A07 | Identity & Auth Failures | JWT with short TTL; refresh token rotation |
| A08 | Software Integrity | Docker image signing; SBOM generation |
| A09 | Logging Failures | Structured logging of auth events; audit trail |
| A10 | SSRF | Allowlisted external URLs; no user-controlled HTTP requests |

## Container Security

| Rule | Detail |
|---|---|
| Base images | Distroless or Alpine only; pin to digest |
| Non-root | All containers run as non-root user |
| Read-only | Root filesystem is read-only where possible |
| Scanning | Trivy scan on all Docker images in CI |
| SBOM | Generate SBOM with Syft on every build |

## Kubernetes Security

| Rule | Detail |
|---|---|
| RBAC | Least-privilege `ServiceAccount` per pod |
| Network policies | Default deny; explicit allow per service |
| Pod security | `restricted` Pod Security Standard |
| Secrets | K8s Secrets encrypted at rest; prefer ExternalSecrets |
| Admission | OPA/Kyverno policies for resource limits, labels |

## AI Agent Security

| Rule | Detail |
|---|---|
| Read-only | AI agents have read-only access to data stores |
| Rate limiting | Max 10 LLM calls per user request |
| Input sanitization | User prompts sanitized before passing to LLM |
| Output filtering | PII detection on agent outputs |
| Prompt injection | System prompts hardened against injection attacks |
