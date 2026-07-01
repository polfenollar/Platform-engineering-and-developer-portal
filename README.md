# Developer Portal — Platform Engineering Layer

```mermaid
flowchart TD
    %% ==========================================
    %% RBAC PERMISSION POLICY (Cross-cutting)
    %% ==========================================
    subgraph RBAC [RBAC Permission Policy - Evaluated on every request]
        rbac_req(["START: Permission Policy Request"])
        rbac_admin{"DECISION: Is User Admin?"}
        rbac_allowA["RESULT: ALLOW\n(Total administrator bypass)"]
        
        rbac_delete{"DECISION: Is permission\ncatalog.entity.delete?"}
        rbac_owner{"DECISION: Is User\nEntity Owner?"}
        rbac_allowB["RESULT: ALLOW\n(Owner can delete their entity)"]
        rbac_denyA["RESULT: DENY\n(Not the owner)"]
        
        rbac_guest{"DECISION: Is User Guest?"}
        rbac_tpl{"DECISION: Is permission\nscaffolder.template.play?"}
        rbac_denyB["RESULT: DENY\n(Guests do not run templates)"]
        
        rbac_action{"DECISION: Is action\ndelete / update?"}
        rbac_denyC["RESULT: DENY\n(Destructive action on another's resource)"]
        rbac_allowC(["RESULT: ALLOW\n(Default stance)"])

        rbac_req --> rbac_admin
        rbac_admin -- "Yes" --> rbac_allowA
        rbac_admin -- "No" --> rbac_delete
        
        rbac_delete -- "Yes" --> rbac_owner
        rbac_owner -- "Yes" --> rbac_allowB
        rbac_owner -- "No" --> rbac_denyA
        
        rbac_delete -- "No" --> rbac_guest
        rbac_guest -- "Yes" --> rbac_tpl
        rbac_tpl -- "Yes" --> rbac_denyB
        rbac_tpl -- "No" --> rbac_action
        
        rbac_guest -- "No" --> rbac_action
        rbac_action -- "Yes" --> rbac_denyC
        rbac_action -- "No" --> rbac_allowC
    end

    %% ==========================================
    %% WORKFLOW A: SHIFT-LEFT CI
    %% ==========================================
    subgraph WFA [Workflow A: Shift-Left CI Pipeline]
        wfa_start(["START: Developer IDE\n(Local commit)"])
        wfa_n1{"LOCAL GATE: Husky / Gitleaks\n(Blocks if secrets detected)"}
        
        wfa_p1["SAST: Semgrep"]
        wfa_p2["Linting: ESLint/Ruff"]
        wfa_p3["Unit Tests\n(Coverage > 80%)"]
        wfa_p4["Kyverno CLI\n(K8s dry-run)"]
        
        wfa_n3["GITHUB: Pull Request\n(Approved after checks)"]
        wfa_n4(["END: Merge to main"])

        wfa_start --> wfa_n1
        wfa_n1 --> wfa_p1 & wfa_p2 & wfa_p3 & wfa_p4
        wfa_p1 & wfa_p2 & wfa_p3 & wfa_p4 --> wfa_n3
        wfa_n3 --> wfa_n4
    end

    %% ==========================================
    %% WORKFLOW B: GITOPS & SECRETS
    %% ==========================================
    subgraph WFB [Workflow B: GitOps & Secrets Loop]
        direction LR
        wfb_start(["START: GitHub Repo\n(Merged config)"])
        wfb_n1["Argo CD Sync Engine\n(Detects drift)"]
        wfb_n2["Argo CD deploys\n(Manifests + CRs)"]
        wfb_n3["External Secrets Operator\n(Auth to OpenBao)"]
        wfb_n4["OpenBao\n(Decrypts secret)"]
        wfb_n5["ESO creates Secret\n(Native K8s)"]
        wfb_n6(["END: Pod restarts\n(Mounts env var)"])

        wfb_start --> wfb_n1 --> wfb_n2 --> wfb_n3 --> wfb_n4 --> wfb_n5 --> wfb_n6
    end

    %% ==========================================
    %% WORKFLOW C: RUNTIME & LOGS
    %% ==========================================
    subgraph WFC [Workflow C: Runtime Request Path & Logging]
        wfc_start(["START: Client App Request"])
        wfc_n1["Istio Ambient (ztunnel)\n(mTLS validation)"]
        wfc_n2["App Container\n(Processes request)"]
        
        wfc_b1["Flipt API\n(Local feature flag eval)"]
        wfc_n3["LiteLLM Proxy Gateway\n(Routes LLM query)"]
        
        wfc_q1["Valkey\n(Rate limits)"]
        wfc_q2["OpenAI / Anthropic\n(LLM Provider)"]
        wfc_q3["Langfuse\n(Traces)"]
        wfc_q4["stdout\n(JSON log)"]
        
        wfc_n4["FluentBit DaemonSet\n(Reads stdout)"]
        wfc_leaf1["Disk queue\n(Backpressure safeguard)"]
        wfc_leaf2(["END: Loki & Postgres\n(Log destination)"])

        wfc_start --> wfc_n1 --> wfc_n2
        wfc_n2 --> wfc_b1
        wfc_n2 --> wfc_n3
        wfc_n3 --> wfc_q1 & wfc_q2 & wfc_q3 & wfc_q4
        wfc_q1 & wfc_q2 & wfc_q3 & wfc_q4 --> wfc_n4
        wfc_n4 --> wfc_leaf1 & wfc_leaf2
    end

    %% ==========================================
    %% WORKFLOW D: SELF-HEALING
    %% ==========================================
    subgraph WFD [Workflow D: Self-Healing Rollback Loop]
        wfd_start(["INCIDENT: Outage / Latency / Error"])
        wfd_n1["Prometheus\n(Detects SLO breach)"]
        wfd_n2["Alertmanager\n(Calls webhook)"]
        wfd_n3["Rollback Controller\n(Listener / Deduplication)"]
        
        wfd_fast["FAST PATH -> Flipt\n(Turns off flag via API)"]
        wfd_slow["SLOW PATH -> GitHub\n(Opens PR reverting config)"]

        wfd_start --> wfd_n1 --> wfd_n2 --> wfd_n3
        wfd_n3 --> wfd_fast & wfd_slow
    end

    %% ==========================================
    %% GLOBAL CONNECTIONS (The High-Level Flow)
    %% ==========================================
    wfa_n4 ==>|Merge to main triggers GitOps| wfb_start
    wfb_n6 ==>|Pod is ready & serving traffic| wfc_start
    wfc_leaf2 -.->|System anomalies detected| wfd_start
    wfd_slow -.->|PR pushed back to repo| wfa_start
```
**Unified platform engineering layer** managing the full code lifecycle (dev → staging → production) for two concurrent projects. Provides a [Backstage](https://backstage.io) service catalog, golden paths for AI developer agents, full CI/CD automation, GitOps deployments, and an end-to-end observability stack.

## Projects Under Management

| Project | Description | Stack | Repo |
|---|---|---|---|
| **Veyor Marketplace** | Freight SaaS connecting shippers with carriers | Next.js · Spring Boot · Go · Python | [Veyor-marketplace](https://github.com/polfenollar/Veyor-marketplace) |
| **BioMedical AI** | Evidence synthesis MLOps platform with multi-agent workflows | Python · LangGraph · Temporal | [evidence-based-biomedical-multiagent-ai](https://github.com/polfenollar/evidence-based-biomedical-multiagent-ai) |

Both repos are included as Git submodules under `projects/`.

---

## Platform Capabilities

| Category | Tools |
|---|---|
| **Developer Portal** | Backstage — service catalog, TechDocs, Scaffolder golden paths, custom RBAC policy backend |
| **CI/CD** | GitHub Actions — 8 reusable workflows (test, build, deploy, lint, scan) |
| **Code Quality** | ESLint · Checkstyle · Ruff · golangci-lint |
| **Testing** | Unit · Integration · E2E (Playwright) · Load (k6) |
| **Security & IAM** | Microsoft Entra ID (SSO & Graph sync) · OIDC Workload Identity · Semgrep · CodeQL · dependency-check |
| **Secrets Management** | OpenBao (Vault) · External Secrets Operator (ESO) |
| **IaC** | Terraform (AWS free-tier) · Crossplane |
| **GitOps** | Argo CD (app-of-apps pattern) · Argo Workflows | SAST DAST scanning for vulnerabilities 
| **Containers** | Docker · Kubernetes (kind local / k3s AWS) · Helm |
| **Service Mesh** | Istio — mTLS, traffic management, circuit breaking |
| **Observability** | OpenTelemetry · Prometheus · Loki · Grafana · Langsmith |
| **LLM Gateway** | LiteLLM Proxy — routing, load balancing, cost tracking, governance |
| **Feature Flags** | Flagsmith (self-hosted) |
| **AI Agent Guardrails**| Architecture + coding standards + strict repository isolation & PR approval boundaries |


---

## Architecture Overview

```
   ┌──────────────────────────────────────────────────────────┐
   │                  Microsoft Entra ID                      │
   │           (SSO, Identity Claims & Group Sync)            │
   └──────────────────────────┬───────────────────────────────┘
                              │ OIDC / MS Graph
   ┌──────────────────────────▼───────────────────────────────┐
   │                  Backstage Developer Portal              │
   │               (Software Catalog & Scaffolder)            │
   │   Enforces group-based template access in rbacPolicy     │
   └──────────────────────────┬───────────────────────────────┘
                              │ Provisioning (K8s ServiceAccount)
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
     ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐
     │  Veyor      │  │  BioMedical  │  │  Platform Layer  │
     │  Marketplace│  │  AI          │  │                  │
     │             │  │              │  │  Argo CD         │
     │  Next.js    │  │  FastAPI     │  │  OTel Collector  │
     │  Spring Boot│  │  Temporal    │  │  Prometheus      │
     │  Go (gRPC)  │  │  LangGraph   │  │  Grafana / Loki  │
     │  FastAPI    │  │  Qdrant      │  │  Flagsmith       │
     │  Kafka      │  │  MinIO       │  │  Istio           │
     └──────┬──────┘  └──────┬───────┘  │  LiteLLM Proxy   │
            │                │          │  OpenBao + ESO   │
            └────────────────┘          └──────────────────┘
                     │
            Kubernetes (annotated ServiceAccounts)
            Workload Identity OIDC Trust Federation (AWS / Azure)
```

---

## GitOps & Platform Architecture (Day 2)

### 1. Repository Re-Architecture (Preventing Brittle Monorepos)
Coupling the portal application with cluster manifests is strictly prohibited. The system is split into three independent repositories with decoupled lifecycles:
- **`developer-portal` (Repository A):** Backstage Code (Node.js/React), UI, backend plugin logic, and RBAC code.
- **`platform-infra-gitops` (Repository B):** Cluster Brain. K8s Manifests, Argo CD Custom Resources, and desired state definition.
- **`golden-path-templates` (Repository C):** Scaffolder Skeletons. Read-only base templates for microservice generation.

### 2. Infrastructure Line of Demarcation
To prevent state collisions, we enforce a strict boundary based on resource lifecycle:
- **Static Layer (Day 0/1) via Terraform:** Foundational resources (VPC, EKS/k3s, global RDS, IAM). Outputs are exported to system configuration or cluster secrets.
- **Dynamic Layer (Day 2) via Crossplane:** Application-specific on-demand resources (logical app DBs, SQS, S3). Developers request these via K8s manifests using Crossplane CRDs, assumed by Day 1 IAM roles.

### 3. Low-Latency Auto-Healing Loop Architecture (Anti-Drift)
Git is the strict Single Source of Truth.
- **Fast-Path Mitigation:** Prometheus detects anomalies (e.g. error spikes from a feature flag) -> Alertmanager groups alerts -> Rollback Controller executes an automated signed commit toggling the flag in `platform-infra-gitops` and pushes to `main` -> GitHub Webhook triggers Argo CD flash reconciliation (< 3 seconds target).
- **Slow-Path Synchronization:** Rollback Controller automatically opens an Issue and PR in the application code repository proposing a revert, attaching Prometheus logs.

---

## Implementation Phases (Execution Roadmap)

Strictly follow this phase execution order. **CRITICAL REQUIREMENT:** Before moving from one phase to the following one, you must upload to Git and merge to the `main` branch to guarantee development stability.

### Phase 0: Emergency Hardening
Stable base networks, namespace segregation via NetworkPolicies, clean configuration of OTel Collector daemonsets, and base alert triggers in Prometheus.
- **Verification:** `kubectl get ds otel-collector -n observability`
- **Gate:** Commit & Merge to `main`.

### Phase 1: Secrets & Persistence
High-availability OpenBao deployment. External Secrets Operator (ESO) CRD configuration. Migration of StatefulSets to dynamic StorageClasses with PVCs. Replacing Redis with Valkey.
- **Verification:** `kubectl get externalsecrets.external-secrets.io -A`
- **Gate:** Commit & Merge to `main`.

### Phase 2: Policy & CI Gates
Integration of restrictive policies into the Kyverno Admission Controller. Creation of the unified CI pipeline in GitHub Actions with automatic blocks on Gitleaks detection and Semgrep/Trivy failures.
- **Verification:** `kyverno test core/kyverno-policies/`
- **Gate:** Commit & Merge to `main`.

### Phase 3: Portal Integration
Deployment of `developer-portal`. Implementation of React dashboards for Agent Observability and LLM Governance. Loading base catalogs and initializing code Golden Paths.
- **Verification:** `yarn --cwd backstage-app tsc`
- **Gate:** Commit & Merge to `main`.

### Phase 4: Async Logging
Optimization of the observability plane. Configuring FluentBit's persistent buffer. Deploying the LiteLLM proxy in async mode and ensuring secure connectivity with Langfuse DB.
- **Verification:** `kubectl logs -l app.kubernetes.io/name=fluentbit -n observability`
- **Gate:** Commit & Merge to `main`.

### Phase 5: Webhook Hardening (Auto-Healing)
Implementation and deployment of the Rollback Controller daemon. Configuration of Argo CD's fast webhook endpoint. Connecting the Alertmanager trigger to the automated controller.
- **Gate:** Commit & Merge to `main`.

---

## Repository Structure

```
developer-portal/
├── backstage-app/                  # Backstage monorepo (portal frontend + backend)
│   ├── packages/app/               # React frontend
│   ├── packages/backend/           # Node.js backend
│   └── app-config.yaml             # Backstage configuration
├── backstage/
│   └── catalog/                    # Backstage catalog entity definitions
│       ├── veyor-catalog.yml
│       └── biomedical-catalog.yml
├── platform/
│   ├── github-actions/             # Reusable CI/CD workflow definitions
│   │   ├── test-unit.yml           # Unit tests (TS, Java, Python, Go)
│   │   ├── test-integration.yml    # Integration tests
│   │   ├── test-e2e.yml            # Playwright E2E tests
│   │   ├── test-load.yml           # k6 load tests
│   │   ├── build-docker.yml        # Multi-service Docker build matrix
│   │   ├── deploy.yml              # Helm deploy to dev / staging / prod
│   │   ├── lint.yml                # All linters
│   │   └── sast-scan.yml           # Semgrep + CodeQL
│   ├── kubernetes/
│   │   ├── base/                   # Namespaces, network policies, resource quotas
│   │   ├── charts/                 # Helm charts (6 services)
│   │   ├── docker/                 # Dockerfiles (6 services)
│   │   └── kind-config.yml         # Local cluster configuration
│   ├── argocd/                     # GitOps app-of-apps manifests
│   ├── argo-workflows/             # Argo Workflows CI/CD templates
│   ├── terraform/                  # AWS IaC modules (networking, compute, DB, storage, k3s)
│   ├── crossplane/                 # Cloud resource XRDs and compositions
│   ├── observability/              # OTel collector, Prometheus, Loki, Grafana, Langsmith
│   ├── service-mesh/               # Istio profiles and traffic policies
│   └── feature-flags/              # Flagsmith deployment
├── golden-paths/
│   ├── templates/                  # Backstage Scaffolder templates
│   └── agent-guardrails/           # Architecture + coding standards for AI agents
│       ├── AGENT_INSTRUCTIONS.md
│       ├── ARCHITECTURE_VEYOR.md
│       ├── ARCHITECTURE_BIOMEDICAL.md
│       ├── CODING_STANDARDS.md
│       ├── TESTING_STRATEGY.md
│       ├── SECURITY_GUARDRAILS.md
│       ├── INFRASTRUCTURE_GUARDRAILS.md
│       └── PR_CHECKLIST.md
├── projects/
│   ├── veyor-marketplace/          # Git submodule
│   └── biomedical-ai/              # Git submodule
├── Makefile                        # Central command hub (47 targets)
└── .env.example                    # Required secrets template
```

---

## Services Catalog

### Veyor Marketplace

| Component | Tech | Port | Description |
|---|---|---|---|
| veyor-frontend | Next.js 14, TypeScript | 3000 | Marketplace UI (App Router) |
| veyor-backend | Spring Boot 3, Java 21 | 8080 | Core API — identity, booking, shipments, notifications |
| veyor-quoting | Go, gRPC | 50051 | Real-time freight quote computation |
| veyor-agents | FastAPI, LangChain | 8000 | AI-powered customer support agent |
| veyor-carrier-simulator | Go, REST | 8081 | Event-driven carrier simulation |

**Data resources:** PostgreSQL · Redis · Kafka

### BioMedical AI

| Component | Tech | Description |
|---|---|---|
| biomedical-api | FastAPI, Python | Evidence queries and synthesis REST API |
| biomedical-workers | Temporal, LangGraph, Python | Data ingestion, embedding, agent orchestration |
| literature-synthesis-agent | LangGraph, Python | Multi-agent PubMed/ClinicalTrials evidence retrieval |

**Data resources:** PostgreSQL · MinIO · Qdrant · Temporal

---

## Quick Start

### Prerequisites

- Docker
- [kind](https://kind.sigs.k8s.io/) (local Kubernetes)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Helm](https://helm.sh/)
- Node.js 22+ and Yarn
- [Terraform](https://www.terraform.io/) (for AWS deployments)

### Local Development

```bash
# 1. Clone with submodules
git clone --recurse-submodules https://github.com/polfenollar/developer-portal.git
cd developer-portal

# 2. Copy and fill environment variables
cp .env.example .env

# 3. Start local Kubernetes cluster (kind)
make cluster-up

# 4. Deploy observability stack (Prometheus, Grafana, Loki, OTel)
make observability-up

# 5. Install Argo CD and sync applications
make argocd-install
make argocd-apps

# 6. Deploy all services to local cluster
make deploy-dev

# 7. Start Backstage portal
make backstage-dev

# 8. Open the portal
open http://localhost:3000
```

### Run Tests

```bash
make test-unit          # Unit tests (TypeScript, Java, Python, Go)
make test-integration   # Integration tests
make test-e2e           # Playwright end-to-end tests
make test-load          # k6 load tests
make lint               # All linters
make scan               # SAST + dependency security scans
```

### Deploy to Staging / Production

```bash
make deploy-staging     # Deploy to AWS k3s staging cluster
make deploy-prod        # Deploy to production (requires approval)
```

---

## CI/CD Pipeline & Multi-Agent Delivery

Every pull request runs automatically through a rigorous pipeline. We mandate an automated testing threshold of **80% unit test coverage**, alongside integration, load, E2E, and shadow testing before production rollout.

Furthermore, we utilize an AI-driven Multi-Agent delivery pipeline:
- **Chief Architect (Claude Opus):** Orchestration agent responsible for high-level system design and directing implementers.
- **Implementers (Claude Sonnet):** On-demand agents functioning as platform engineers and developers to execute the architecture.

```
PR opened (Agent/Human)
    │
    ├── lint          ESLint · Checkstyle · Ruff · golangci-lint
    ├── test-unit     Jest · JUnit · pytest · Go test (Must be > 80% coverage)
    ├── test-integration
    ├── sast-scan     Semgrep · CodeQL · dependency audits
    ├── test-e2e      Playwright automated UI workflows
    ├── test-load     k6 load testing
    └── build-docker  Multi-service image matrix build
              │
              └── (merge to main)
                        │
                        └── deploy → dev → staging → shadow testing → prod (gated)
```

All workflows are defined as reusable GitHub Actions in `platform/github-actions/` and called from each project's `.github/workflows/`.

---

## GitOps with Argo CD

Deployments to Kubernetes are fully GitOps-driven:

- The `platform/argocd/app-of-apps.yml` root application watches the `main` branch
- Any merged change to a Helm chart or manifest automatically triggers a sync
- Environments are isolated by namespace: `dev`, `staging`, `production`, `observability`, `platform`, `argocd`

```bash
make argocd-install    # Bootstrap Argo CD into the cluster
make argocd-apps       # Apply app-of-apps manifest
# Argo CD UI available at http://localhost:30080
```

---

## Observability (High-Volume AI Mesh)

The full observability stack is deployed as Kubernetes manifests, specifically designed to handle high-volume LLM traces without causing network degradation or memory exhaustion:

| Tool | Purpose | Port |
|---|---|---|
| OpenTelemetry Collector | Receives traces/metrics/logs from all services | 4317 (gRPC), 4318 (HTTP) |
| Prometheus | Metrics scraping and storage | 9090 |
| Loki | Log aggregation (Traditional System Metrics & Indexes) | 3100 |
| Grafana | Dashboards and alerting | 30030 |
| FluentBit | Collection Agent (DaemonSet). Configured with **persistent disk buffers** (`storage.path`) to mitigate backpressure if Loki experiences latency. | n/a |
| LiteLLM Proxy | Asynchronous LLM routing and governance. Writes structured JSON directly to `stdout` to avoid blocking inference threads. | 4000 |
| Langfuse | Isolated Complex AI Traces. Captures tokens, latency, embeddings, and cost in a dedicated PostgreSQL/ClickHouse DB. | cloud |

All services emit traces via OTLP. Grafana dashboards are pre-configured for each service.

---

## Feature Flags

[Flagsmith](https://flagsmith.com) is self-hosted on Kubernetes alongside a dedicated PostgreSQL instance. Services read flags via the Flagsmith SDK using the `FLAGSMITH_ENVIRONMENT_KEY` environment variable.

---

## AI Agent Guardrails & Orchestration

The `golden-paths/agent-guardrails/` directory contains markdown documents consumed directly by our AI coding agents. Following the Chief Architect / Implementer model:

- **Orchestrator Role:** Claude Opus consumes these guardrails to validate the system design.
- **Implementer Role:** Claude Sonnet consumes these guardrails to execute code changes.

Guardrail Documents:
- **AGENT_INSTRUCTIONS.md** — Mandatory 11-step workflow every agent must follow before opening a PR
- **ARCHITECTURE_VEYOR.md** — Module boundaries, service contracts, event schemas
- **ARCHITECTURE_BIOMEDICAL.md** — Data flow, agent patterns, lakehouse design
- **CODING_STANDARDS.md** — Language-specific conventions (TypeScript, Java, Go, Python)
- **TESTING_STRATEGY.md** — Testing pyramid, shadow testing, and **80% coverage requirements**
- **SECURITY_GUARDRAILS.md** — OWASP top-10 rules, secret management, scanning requirements
- **INFRASTRUCTURE_GUARDRAILS.md** — Kubernetes namespace strategy, Terraform module rules
- **PR_CHECKLIST.md** — Pre-merge validation checklist

---

## Infrastructure as Code

### Local (kind)

```bash
make cluster-up        # 3-node kind cluster (control-plane + 2 workers)
make docker-load       # Build and load all Docker images into kind
```

### AWS (Terraform)

Terraform modules under `platform/terraform/modules/`:

| Module | Description |
|---|---|
| `networking` | VPC, subnets, security groups |
| `compute` | EC2 instances |
| `database` | RDS / Aurora |
| `storage` | S3, DynamoDB |
| `k3s-cluster` | Lightweight Kubernetes on EC2 |

```bash
make tf-init     # terraform init
make tf-plan     # terraform plan
make tf-apply    # terraform apply
```

All modules target the AWS free tier.

---

## Environment Variables

Copy `.env.example` to `.env` and populate:

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | GitHub API integration for Backstage |
| `LANGCHAIN_API_KEY` | Langsmith LLM observability |
| `LANGCHAIN_PROJECT` | Langsmith project name |
| `AWS_ACCESS_KEY_ID` | AWS infrastructure access |
| `AWS_SECRET_ACCESS_KEY` | AWS infrastructure secret |
| `AWS_REGION` | AWS deployment region |
| `FLAGSMITH_ENVIRONMENT_KEY` | Feature flag SDK key |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin login |

---

## Make Targets Reference

```bash
# Cluster
make cluster-up             # Create local kind cluster
make cluster-down           # Delete local kind cluster
make cluster-status         # Check cluster health

# Backstage
make backstage-dev          # Start Backstage in dev mode (Yarn)
make backstage-build        # Production build

# Deploy
make deploy-dev             # Deploy all services to kind
make deploy-staging         # Deploy to AWS k3s staging cluster
make deploy-prod            # Deploy to production

# Code quality
make lint                   # Run all linters
make test                   # Unit + integration tests
make test-unit              # Unit tests only
make test-integration       # Integration tests only
make test-e2e               # Playwright E2E tests
make test-load              # k6 load tests
make scan                   # SAST + dependency security scans

# Docker
make docker-build           # Build all service images
make docker-load            # Build + load images into kind

# Infrastructure
make tf-init                # Terraform init
make tf-plan                # Terraform plan
make tf-apply               # Terraform apply
make argocd-install         # Install Argo CD
make argocd-apps            # Apply app-of-apps
make argo-workflows-install # Install Argo Workflows
make observability-up       # Deploy full observability stack
```

---

## License

MIT License — Copyright (c) 2026 Pol Fenollar Villà
