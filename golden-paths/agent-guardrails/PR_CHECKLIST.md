# PR Checklist

Use this checklist before marking a PR as ready for review.

## Required for ALL PRs

- [ ] Branch name follows convention: `feat/`, `fix/`, `chore/`, `docs/`
- [ ] Commit messages follow Conventional Commits
- [ ] No secrets, API keys, or credentials in the diff
- [ ] No `TODO` without ticket references
- [ ] No commented-out code
- [ ] Code passes `make lint` locally

## Code Quality

- [ ] New functions have appropriate type hints / type annotations
- [ ] Public functions have docstrings / Javadoc / GoDoc
- [ ] Error handling is explicit (no swallowed exceptions)
- [ ] No N+1 queries or unbounded loops
- [ ] Code follows language-specific standards in `CODING_STANDARDS.md`

## Testing

- [ ] Unit tests added/updated for new logic
- [ ] Integration tests added if touching DB/API/messaging
- [ ] Tests pass locally: `make test-unit`
- [ ] Code coverage ≥ 80% (unit tests)
- [ ] Edge cases covered (null, empty, boundary values)

## Architecture

- [ ] Changes respect module boundaries in `ARCHITECTURE_*.md`
- [ ] No cross-module direct dependencies added
- [ ] Database changes have migration files
- [ ] API changes have OpenAPI spec updates
- [ ] Breaking changes documented with ADR

## Infrastructure (if applicable)

- [ ] Helm chart values updated
- [ ] Kubernetes manifests validated with `kubeval`
- [ ] Terraform changes validated with `terraform plan`
- [ ] Resource limits set on new pods
- [ ] Health checks defined for new services

## Observability

- [ ] New endpoints have metrics instrumentation
- [ ] New services emit structured logs
- [ ] OpenTelemetry tracing added for critical paths
- [ ] Grafana dashboard updated if new metrics added

## Security

- [ ] SAST scan passes: `make scan`
- [ ] No new dependencies with known vulnerabilities
- [ ] Auth/authz applied to new endpoints
- [ ] Input validation on all user-facing inputs
