# Security Guardrails

## Secrets Management

| Rule | Detail |
|---|---|
| **No hardcoded secrets** | Never commit API keys, passwords, tokens, or credentials |
| **Environment variables** | All secrets via env vars; `.env.example` files for documentation |
| **.gitignore** | `.env`, `.env.local`, `*.pem`, `*.key`, `*.tfvars` must be in `.gitignore` |
| **K8s Secret Injection** | MUST use **OpenBao** and **External Secrets Operator (ESO)**. Native Kubernetes Secrets or Sealed Secrets are prohibited for production credentials. |
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
| Secrets | Managed entirely by OpenBao + ExternalSecrets Operator. Avoid manual Secret creation. |
| Admission | OPA/Kyverno policies for resource limits, labels |

## AI Agent Security & IAM Boundaries

| Rule | Detail |
|---|---|
| **Least Privilege** | AI agents must only have access to repositories matching their scope. No organization-wide admin keys allowed. |
| **Workload Identity**| Prefer OpenID Connect (OIDC) / AWS IAM Role assumption over static long-lived credentials. |
| **Token Scoping**   | Agent GitHub Actions tokens must be restricted to minimal permissions (`contents: read`, `pull-requests: write`). |
| **No Self-Merge**   | AI agents are blocked from approving Pull Requests or merging directly to protected branches. |
| **Branch Protection**| All repositories must enforce branch protection: minimum 1 human review, no bypassing requirements, no direct push. |
| **Read-only Stores**| AI agents have read-only access to staging/production data stores and cloud resources. |
| **Rate limiting**   | Max 10 LLM calls per user request to prevent runaway loops. |
| **Input/Output**    | Prompt sanitization before LLM and PII filtering on agent outputs. |

