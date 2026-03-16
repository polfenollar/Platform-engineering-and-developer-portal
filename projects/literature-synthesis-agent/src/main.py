"""FastAPI entry point for the Literature Synthesis Agent.

Presentation Layer — may only call Orchestration layer (ARCHITECTURE_BIOMEDICAL.md).
"""

import uuid

import structlog
from fastapi import FastAPI, HTTPException
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import Counter, Histogram, make_asgi_app
from pydantic import BaseModel

from src.agents.synthesis_agent import SynthesisState, runnable

# ── Observability setup ───────────────────────────────────────────────────────
_provider = TracerProvider()
_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
trace.set_tracer_provider(_provider)
_tracer = trace.get_tracer("literature-synthesis-agent")

_requests_total = Counter("synthesis_requests_total", "Total synthesis requests")
_request_latency = Histogram("synthesis_request_duration_seconds", "Request latency")

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ]
)
logger = structlog.get_logger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Literature Synthesis Agent", version="0.1.0")
app.mount("/metrics", make_asgi_app())


class SynthesisRequest(BaseModel):
    query: str


class SynthesisResponse(BaseModel):
    synthesis: str
    sources: list[str]
    correlation_id: str


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/synthesise", response_model=SynthesisResponse)
async def synthesise(req: SynthesisRequest) -> SynthesisResponse:
    """Run the LangGraph synthesis pipeline for a biomedical query."""
    correlation_id = str(uuid.uuid4())
    log = logger.bind(correlation_id=correlation_id)
    log.info("synthesis_request_received", query=req.query)

    _requests_total.inc()
    with _request_latency.time():
        with _tracer.start_as_current_span("synthesis_pipeline") as span:
            span.set_attribute("query", req.query)
            span.set_attribute("correlation_id", correlation_id)

            initial: SynthesisState = {
                "query": req.query,
                "pubmed_docs": [],
                "clinical_docs": [],
                "vector_docs": [],
                "synthesis": "",
                "sources": [],
                "correlation_id": correlation_id,
                "audit_trail": [],
            }

            try:
                result: SynthesisState = await runnable.ainvoke(initial)  # type: ignore[assignment]
            except Exception as exc:
                log.error("synthesis_failed", error=str(exc))
                raise HTTPException(status_code=500, detail="Synthesis pipeline failed") from exc

    log.info("synthesis_complete", source_count=len(result["sources"]))
    return SynthesisResponse(
        synthesis=result["synthesis"],
        sources=result["sources"],
        correlation_id=correlation_id,
    )
