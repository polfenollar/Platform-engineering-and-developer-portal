"""Audit trail logger — every agent decision must be logged with timestamps.

ARCHITECTURE_BIOMEDICAL.md: Audit trail — all agent decisions logged to audit store.
"""

import datetime
import json
import os
from pathlib import Path

import structlog

logger = structlog.get_logger(__name__)
_AUDIT_DIR = Path(os.getenv("AUDIT_LOG_DIR", "/tmp/audit"))


def log_agent_decision(
    agent: str,
    node: str,
    correlation_id: str,
    sources: list[str],
) -> None:
    """Append an immutable audit record for an agent decision.

    Args:
        agent: Agent service name.
        node: LangGraph node that produced the decision.
        correlation_id: Request correlation ID for tracing.
        sources: List of DOI / NCT IDs cited in the output.
    """
    _AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    record = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "agent": agent,
        "node": node,
        "correlation_id": correlation_id,
        "sources": sources,
        "source_count": len(sources),
    }
    audit_file = _AUDIT_DIR / f"{correlation_id}.jsonl"
    with audit_file.open("a") as fh:
        fh.write(json.dumps(record) + "\n")

    logger.info(
        "audit_record_written",
        agent=agent,
        node=node,
        correlation_id=correlation_id,
        sources=sources,
    )
