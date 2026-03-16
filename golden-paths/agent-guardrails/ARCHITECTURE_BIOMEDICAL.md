# Architecture Guardrails — BioMedical Evidence AI

## System Overview

Production-grade, self-hosted biomedical evidence synthesis platform using a governed **lakehouse architecture** and **deterministic multi-agent workflows** for medical research.

## Architecture Layers (strict separation)

```
┌──────────────────────────────────────────────────────────────┐
│                    Presentation Layer                         │
│           FastAPI endpoints  ·  Streamlit UI                 │
└─────────────────────────┬────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│              Orchestration Layer                              │
│     LangGraph (cognitive state machine) — agent routing      │
│     Temporal (durable workflows)  — pipeline orchestration   │
└─────────┬────────────────────────────────┬───────────────────┘
          │                                │
┌─────────▼──────────┐   ┌────────────────▼───────────────────┐
│   Agent Layer       │   │       Data Pipeline Layer          │
│  • Retrieval Agent  │   │  • PubMed Ingestion Worker        │
│  • Synthesis Agent  │   │  • ClinicalTrials Ingestion       │
│  • Quality Agent    │   │  • Embedding Pipeline             │
│  • Audit Agent      │   │  • Feature Engineering (Feast)    │
└─────────┬──────────┘   └────────────────┬───────────────────┘
          │                                │
┌─────────▼────────────────────────────────▼───────────────────┐
│                 Governed Lakehouse                            │
│    MinIO (object storage)  +  Apache Iceberg (table format)  │
│    Bronze → Silver → Gold  medallion architecture            │
└─────────┬────────────────────────────────┬───────────────────┘
          │                                │
┌─────────▼──────────┐   ┌────────────────▼───────────────────┐
│   Vector Store      │   │    Feature Store                   │
│   Qdrant / Milvus   │   │    Feast (ground truth stats)     │
└────────────────────┘   └────────────────────────────────────┘
```

## Layer Rules (Do NOT violate)

| Layer | Can Call | Cannot Call |
|---|---|---|
| Presentation | Orchestration | Agent, Data Pipeline, Lakehouse |
| Orchestration | Agent, Data Pipeline | Lakehouse (directly) |
| Agent | Lakehouse (via retrieval tools) | Data Pipeline, Presentation |
| Data Pipeline | Lakehouse | Agent, Presentation |

## Agent Design Rules

| Rule | Detail |
|---|---|
| Determinism | Agents MUST produce reproducible results; use `temperature=0` |
| Provenance | Every agent output MUST include source citations with DOI/NCT IDs |
| Audit trail | All agent decisions logged to audit store with timestamps |
| Evidence manifest | Each synthesis includes a manifest listing all sources used |
| Tool access | Agents access data ONLY via defined LangChain/LangGraph tools |
| No hallucination | Agents MUST NOT synthesize information not in retrieved documents |

## Data Governance Rules

| Rule | Detail |
|---|---|
| Medallion layers | Bronze (raw) → Silver (validated) → Gold (aggregated) |
| Schema evolution | Via Apache Iceberg; never drop columns, only add or deprecate |
| ACID guarantees | All writes through Iceberg transactions |
| Snapshots | Iceberg snapshots retained for 90 days minimum |
| Data quality | Every Silver promotion must pass quality checks in `data-quality-rules.yml` |

## Temporal Workflow Rules

| Rule | Detail |
|---|---|
| Idempotency | All activities MUST be idempotent with deterministic IDs |
| Retry policy | Max 3 retries, exponential backoff (1s, 5s, 25s) |
| Timeouts | StartToClose ≤ 5m for activities, ≤ 30m for workflows |
| Versioning | Use Temporal versioning API for workflow changes |
| Child workflows | Use for independent sub-pipelines; never nest > 2 levels |

## Observability Requirements

- **Metrics**: Prometheus counters for ingested records, agent invocations, query latency
- **Traces**: OpenTelemetry spans for each agent step, Langsmith for LLM traces
- **Logs**: Structured JSON via `structlog`; include `correlation_id` in every log
- **Dashboards**: Grafana dashboards for pipeline health, agent performance, data freshness

## Python Code Rules

| Rule | Detail |
|---|---|
| Type hints | All functions MUST have type hints (enforced by `mypy`) |
| Docstrings | Google-style docstrings on all public functions |
| Package manager | `uv` or `poetry`; dependencies in `pyproject.toml` |
| Testing | `pytest` only; fixtures in `conftest.py` |
| Async | Use `asyncio` for I/O-bound operations; `trio` prohibited |
