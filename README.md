# 🏗️ Developer Portal — Platform Engineering Layer

**Unified platform engineering layer** managing the full code lifecycle (dev → staging → production) for two concurrent projects, providing golden paths to AI developer agents via Backstage.

## Projects Under Management

| Project | Description | Stack | Repo |
|---|---|---|---|
| **Veyor Marketplace** | Freight SaaS Marketplace | Next.js · Spring Boot · Go · Python | [Veyor-marketplace](https://github.com/polfenollar/Veyor-marketplace) |
| **BioMedical AI** | Evidence synthesis MLOps platform | Python · LangGraph · Temporal | [evidence-based-biomedical-multiagent-ai](https://github.com/polfenollar/evidence-based-biomedical-multiagent-ai) |

## Platform Capabilities

| Category | Tools |
|---|---|
| **Portal** | Backstage (service catalog, golden paths, TechDocs) |
| **CI/CD** | GitHub Actions (reusable workflows, deployment protection) |
| **Code Quality** | ESLint, Checkstyle, Ruff, golangci-lint, Semgrep, CodeQL |
| **Testing** | Unit · Integration · E2E (Playwright) · Load (k6) |
| **IaC** | Terraform (AWS free-tier) + Crossplane |
| **GitOps** | Argo CD (app-of-apps) + Argo Workflows |
| **Containers** | Docker · Kubernetes (kind / k3s) · Helm |
| **Service Mesh** | Istio (mTLS, traffic management) |
| **Observability** | OpenTelemetry · Grafana · Loki · Prometheus · Langsmith |
| **Feature Flags** | Flagsmith (self-hosted) |
| **Dev Environment** | Cursor IDE · Architecture guardrails (.md) |

## Quick Start

```bash
# 1. Clone with submodules
git clone --recurse-submodules https://github.com/polfenollar/developer-portal.git
cd developer-portal

# 2. Start local K8s cluster
make cluster-up

# 3. Start Backstage portal
make backstage-dev

# 4. Deploy all services to local cluster
make deploy-dev

# 5. Open Backstage
open http://localhost:3000
```

## Directory Structure

```
developer-portal/
├── backstage/                    # Backstage app (portal, catalog, templates)
├── platform/
│   ├── github-actions/           # Shared reusable CI/CD workflows
│   ├── terraform/                # AWS IaC (free-tier modules)
│   ├── crossplane/               # Cloud resource compositions
│   ├── kubernetes/               # K8s manifests, Helm charts, Dockerfiles
│   ├── argocd/                   # Argo CD application manifests
│   ├── argo-workflows/           # Argo Workflows CI/CD templates
│   ├── observability/            # OTel, Grafana, Loki, Prometheus, Langsmith
│   ├── service-mesh/             # Istio configuration
│   └── feature-flags/            # Flagsmith configuration
├── golden-paths/
│   ├── templates/                # Backstage scaffolder templates
│   └── agent-guardrails/         # .md architecture guardrails for AI agents
├── projects/
│   ├── veyor-marketplace/        # Git submodule → Veyor repo
│   └── biomedical-ai/            # Git submodule → BioMedical repo
├── .cursor/                      # Cursor IDE configuration
└── .github/                      # Root GitHub Actions workflows
```

## Make Targets

```bash
make cluster-up          # Create local kind cluster
make cluster-down        # Delete local kind cluster
make backstage-dev       # Start Backstage in dev mode
make deploy-dev          # Deploy all services to dev cluster
make deploy-staging      # Deploy to staging (AWS k3s)
make lint                # Run all linters
make test                # Run all tests
make scan                # Run SAST scanning
make argocd-install      # Install Argo CD in cluster
make observability-up    # Deploy observability stack
```

## License

MIT License — Copyright (c) 2026 Pol Fenollar Villà
