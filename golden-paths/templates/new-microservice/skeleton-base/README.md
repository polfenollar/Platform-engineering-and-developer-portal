# ${{ name }}

${{ description }}

Generated via Backstage Golden Path Template: **New Microservice**.

## Getting Started

### Local Development

1. Install dependencies and start the service.
2. The service listens on port `${{ port }}`.

## Deployment

Deploy using Kubernetes manifests under `./kubernetes`:
```bash
kubectl apply -f kubernetes/external-secret.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
```
