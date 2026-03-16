# ============================================================================
# Developer Portal — Platform Engineering Makefile
# ============================================================================

.DEFAULT_GOAL := help
SHELL := /bin/bash

# --- Cluster Management ---
KIND_CLUSTER_NAME := developer-portal
KIND_CONFIG := platform/kubernetes/kind-config.yml

.PHONY: cluster-up
cluster-up: ## Create local kind cluster
	@echo "🚀 Creating kind cluster '$(KIND_CLUSTER_NAME)'..."
	kind create cluster --name $(KIND_CLUSTER_NAME) --config $(KIND_CONFIG)
	@echo "✅ Cluster ready."

.PHONY: cluster-down
cluster-down: ## Delete local kind cluster
	kind delete cluster --name $(KIND_CLUSTER_NAME)

.PHONY: cluster-status
cluster-status: ## Check cluster status
	kubectl cluster-info --context kind-$(KIND_CLUSTER_NAME)
	kubectl get nodes

# --- Backstage ---
.PHONY: backstage-dev
backstage-dev: ## Start Backstage in dev mode
	cd backstage && yarn install && yarn dev

.PHONY: backstage-build
backstage-build: ## Build Backstage for production
	cd backstage && yarn build

# --- Deployment ---
.PHONY: deploy-dev
deploy-dev: ## Deploy all services to dev (kind) cluster
	kubectl config use-context kind-$(KIND_CLUSTER_NAME)
	kubectl apply -k platform/kubernetes/base/
	@for chart in platform/kubernetes/charts/*/; do \
		name=$$(basename $$chart); \
		echo "📦 Installing $$name..."; \
		helm upgrade --install $$name $$chart -n dev --create-namespace; \
	done
	@echo "✅ All services deployed to dev."

.PHONY: deploy-staging
deploy-staging: ## Deploy all services to staging (AWS k3s)
	kubectl config use-context staging
	@for chart in platform/kubernetes/charts/*/; do \
		name=$$(basename $$chart); \
		helm upgrade --install $$name $$chart -n staging --create-namespace \
			-f $$chart/values-staging.yaml; \
	done

.PHONY: deploy-prod
deploy-prod: ## Deploy all services to production
	kubectl config use-context production
	@for chart in platform/kubernetes/charts/*/; do \
		name=$$(basename $$chart); \
		helm upgrade --install $$name $$chart -n production --create-namespace \
			-f $$chart/values-prod.yaml; \
	done

# --- Code Quality ---
.PHONY: lint
lint: lint-ts lint-java lint-python lint-go ## Run all linters

.PHONY: lint-ts
lint-ts:
	@echo "🔍 Linting TypeScript..."
	cd projects/veyor-marketplace/frontend && npx eslint . --ext .ts,.tsx

.PHONY: lint-java
lint-java:
	@echo "🔍 Linting Java..."
	cd projects/veyor-marketplace/backend && ./gradlew checkstyleMain

.PHONY: lint-python
lint-python:
	@echo "🔍 Linting Python..."
	cd projects/biomedical-ai && ruff check src/ tests/
	cd projects/veyor-marketplace/agents && ruff check .

.PHONY: lint-go
lint-go:
	@echo "🔍 Linting Go..."
	cd projects/veyor-marketplace/quoting-service && golangci-lint run
	cd projects/veyor-marketplace/carrier-simulator && golangci-lint run

# --- Testing ---
.PHONY: test
test: test-unit test-integration ## Run unit + integration tests

.PHONY: test-unit
test-unit: ## Run unit tests
	@echo "🧪 Running unit tests..."
	cd projects/veyor-marketplace/frontend && npm test
	cd projects/veyor-marketplace/backend && ./gradlew test
	cd projects/biomedical-ai && python -m pytest tests/unit/ -v

.PHONY: test-integration
test-integration: ## Run integration tests
	@echo "🔗 Running integration tests..."
	cd projects/veyor-marketplace/backend && ./gradlew integrationTest
	cd projects/biomedical-ai && python -m pytest tests/integration/ -v

.PHONY: test-e2e
test-e2e: ## Run end-to-end tests
	@echo "🌐 Running E2E tests..."
	cd projects/veyor-marketplace/frontend && npx playwright test

.PHONY: test-load
test-load: ## Run load tests
	@echo "⚡ Running load tests..."
	k6 run platform/kubernetes/charts/veyor-backend/tests/load.js
	k6 run platform/kubernetes/charts/biomedical-api/tests/load.js

# --- Security ---
.PHONY: scan
scan: scan-sast scan-deps ## Run all security scans

.PHONY: scan-sast
scan-sast: ## Run SAST scanning (Semgrep)
	@echo "🔒 Running SAST scan..."
	semgrep scan --config auto projects/

.PHONY: scan-deps
scan-deps: ## Scan dependencies for vulnerabilities
	@echo "🔒 Scanning dependencies..."
	cd projects/veyor-marketplace/frontend && npm audit
	cd projects/veyor-marketplace/backend && ./gradlew dependencyCheckAnalyze
	cd projects/biomedical-ai && pip-audit

# --- Infrastructure ---
.PHONY: tf-init
tf-init: ## Initialize Terraform
	cd platform/terraform/environments/dev && terraform init

.PHONY: tf-plan
tf-plan: ## Plan Terraform changes
	cd platform/terraform/environments/dev && terraform plan

.PHONY: tf-apply
tf-apply: ## Apply Terraform changes
	cd platform/terraform/environments/dev && terraform apply

# --- GitOps ---
.PHONY: argocd-install
argocd-install: ## Install Argo CD in cluster
	kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -n argocd -f platform/argocd/bootstrap/argocd-install.yml
	@echo "⏳ Waiting for Argo CD pods..."
	kubectl wait --for=condition=Ready pods --all -n argocd --timeout=120s
	@echo "✅ Argo CD installed."

.PHONY: argocd-apps
argocd-apps: ## Deploy Argo CD app-of-apps
	kubectl apply -f platform/argocd/app-of-apps.yml
	@echo "✅ App-of-apps deployed."

.PHONY: argo-workflows-install
argo-workflows-install: ## Install Argo Workflows
	kubectl create namespace argo --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -n argo -f https://github.com/argoproj/argo-workflows/releases/latest/download/install.yaml

# --- Observability ---
.PHONY: observability-up
observability-up: ## Deploy observability stack
	kubectl apply -f platform/observability/otel-collector/deployment.yml
	kubectl apply -f platform/observability/prometheus/prometheus.yml
	kubectl apply -f platform/observability/loki/deployment.yml
	kubectl apply -f platform/observability/grafana/deployment.yml
	@echo "✅ Observability stack deployed."

# --- Docker ---
.PHONY: docker-build
docker-build: ## Build all Docker images
	@echo "🐳 Building Docker images..."
	docker build -t veyor-frontend:dev -f platform/kubernetes/docker/veyor/Dockerfile.frontend projects/veyor-marketplace/frontend
	docker build -t veyor-backend:dev -f platform/kubernetes/docker/veyor/Dockerfile.backend projects/veyor-marketplace/backend
	docker build -t veyor-quoting:dev -f platform/kubernetes/docker/veyor/Dockerfile.quoting projects/veyor-marketplace/quoting-service
	docker build -t veyor-agents:dev -f platform/kubernetes/docker/veyor/Dockerfile.agents projects/veyor-marketplace/agents
	docker build -t biomedical-api:dev -f platform/kubernetes/docker/biomedical/Dockerfile.api projects/biomedical-ai
	docker build -t biomedical-workers:dev -f platform/kubernetes/docker/biomedical/Dockerfile.workers projects/biomedical-ai
	@echo "✅ All images built."

.PHONY: docker-load
docker-load: docker-build ## Build + load images into kind cluster
	@for img in veyor-frontend veyor-backend veyor-quoting veyor-agents biomedical-api biomedical-workers; do \
		kind load docker-image $$img:dev --name $(KIND_CLUSTER_NAME); \
	done

# --- Help ---
.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
