# Infrastructure Guardrails

## Namespace Strategy

| Namespace | Project | Environment | Purpose |
|---|---|---|---|
| `veyor-dev` | Veyor Marketplace | Development | Feature testing |
| `veyor-staging` | Veyor Marketplace | Staging | Pre-production validation |
| `veyor-prod` | Veyor Marketplace | Production | Live traffic |
| `biomedical-dev` | BioMedical AI | Development | Feature testing |
| `biomedical-staging` | BioMedical AI | Staging | Pre-production validation |
| `biomedical-prod` | BioMedical AI | Production | Live traffic |
| `platform` | Shared | All | Argo CD, Backstage, observability |
| `istio-system` | Shared | All | Service mesh control plane |

## Kubernetes Resource Standards

### Required Labels (all resources)
```yaml
metadata:
  labels:
    app.kubernetes.io/name: "service-name"
    app.kubernetes.io/part-of: "veyor" | "biomedical"
    app.kubernetes.io/component: "frontend" | "backend" | "worker"
    app.kubernetes.io/managed-by: "helm"
    environment: "dev" | "staging" | "prod"
```

### Resource Limits (mandatory)
```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

### Health Checks (mandatory)
```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /readyz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Terraform Conventions

| Convention | Rule |
|---|---|
| Module structure | `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf` |
| Resource naming | `{project}-{environment}-{resource}` (e.g., `veyor-staging-rds`) |
| Tagging | All resources tagged with `Project`, `Environment`, `ManagedBy=terraform` |
| State | Remote S3 backend with DynamoDB locking |
| Workspaces | One workspace per environment (`dev`, `staging`, `prod`) |
| Variables | Every variable has `description`, `type`, and `default` if optional |
| Sensitive | Mark sensitive variables with `sensitive = true` |

## Helm Chart Standards

```
charts/{service-name}/
├── Chart.yaml          # apiVersion: v2, appVersion from CI
├── values.yaml         # Default dev values
├── values-staging.yaml # Staging overrides
├── values-prod.yaml    # Production overrides
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml        # Horizontal Pod Autoscaler
│   ├── pdb.yaml        # Pod Disruption Budget (staging/prod)
│   └── _helpers.tpl
└── tests/
    └── test-connection.yaml
```

## Deployment Strategy

| Environment | Strategy | Approval |
|---|---|---|
| `dev` | Rolling update, auto-sync | None (automatic) |
| `staging` | Blue/green via Argo Rollouts | CI passes |
| `prod` | Canary (10% → 50% → 100%) | Manual approval required |

## AWS Free Tier Boundaries

| Service | Free Tier Limit | Our Usage |
|---|---|---|
| EC2 | 750 hrs/mo t2.micro | k3s node (t3.micro) |
| S3 | 5GB storage | Terraform state, artifacts |
| RDS | 750 hrs/mo db.t3.micro | PostgreSQL for Veyor + BioMedical |
| ECR | 500MB storage | Docker images |
| CloudWatch | 10 custom metrics | Basic alarms only |

> ⚠️ Monitor AWS billing alerts. Set budget alarm at $5/mo threshold.
