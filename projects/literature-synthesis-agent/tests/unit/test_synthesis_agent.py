"""Unit tests for the LangGraph synthesis agent nodes.

Testing standards: pytest + pytest-asyncio, 80%+ coverage required.
"""

import pytest

from src.agents.synthesis_agent import (
    SynthesisState,
    quality_node,
    retrieve_node,
    synthesise_node,
)


def _base_state(**overrides: object) -> SynthesisState:
    defaults: SynthesisState = {
        "query": "CRISPR off-target effects in clinical trials",
        "pubmed_docs": [],
        "clinical_docs": [],
        "vector_docs": [],
        "synthesis": "",
        "sources": [],
        "correlation_id": "test-corr-123",
        "audit_trail": [],
    }
    return {**defaults, **overrides}  # type: ignore[return-value]


# ── quality_node ─────────────────────────────────────────────────────────────

def test_quality_node_passes_with_sources() -> None:
    state = _base_state(synthesis="Some synthesis.", sources=["PMID:12345"])
    result = quality_node(state)
    assert result["synthesis"] == "Some synthesis."
    assert result["sources"] == ["PMID:12345"]


def test_quality_node_rejects_empty_sources() -> None:
    state = _base_state(synthesis="Hallucinated text.", sources=[])
    result = quality_node(state)
    assert "REJECTED" in result["synthesis"]


def test_quality_node_appends_nothing_to_audit_trail() -> None:
    """quality_node should not modify the audit trail."""
    state = _base_state(sources=["PMID:1"], audit_trail=["retrieve: done"])
    result = quality_node(state)
    assert result["audit_trail"] == ["retrieve: done"]


# ── retrieve_node (mocked) ────────────────────────────────────────────────────

def test_retrieve_node_appends_audit_entry(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "src.agents.synthesis_agent.retrieve_pubmed", lambda q: [{"id": "PMID:1", "title": "T", "abstract": "A"}]
    )
    monkeypatch.setattr("src.agents.synthesis_agent.retrieve_clinical_trials", lambda q: [])
    monkeypatch.setattr("src.agents.synthesis_agent.vector_search", lambda q: [])

    state = _base_state()
    result = retrieve_node(state)
    assert any("retrieve:" in entry for entry in result["audit_trail"])
    assert len(result["pubmed_docs"]) == 1


def test_retrieve_node_handles_empty_results(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("src.agents.synthesis_agent.retrieve_pubmed", lambda q: [])
    monkeypatch.setattr("src.agents.synthesis_agent.retrieve_clinical_trials", lambda q: [])
    monkeypatch.setattr("src.agents.synthesis_agent.vector_search", lambda q: [])

    state = _base_state()
    result = retrieve_node(state)
    assert result["pubmed_docs"] == []
    assert result["clinical_docs"] == []
    assert result["vector_docs"] == []


# ── synthesise_node (mocked) ─────────────────────────────────────────────────

def test_synthesise_node_returns_no_evidence_message_when_empty(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("src.agents.synthesis_agent.log_agent_decision", lambda **kw: None)
    state = _base_state(pubmed_docs=[], clinical_docs=[], vector_docs=[])
    result = synthesise_node(state)
    assert "No evidence found" in result["synthesis"]
    assert result["sources"] == []


def test_synthesise_node_extracts_source_ids(monkeypatch: pytest.MonkeyPatch) -> None:
    class _FakeLLM:
        def invoke(self, _prompt: str) -> object:
            class _Resp:
                content = "Synthesis text with [PMID:42] citation."
            return _Resp()

    monkeypatch.setattr("src.agents.synthesis_agent._llm", _FakeLLM())
    monkeypatch.setattr("src.agents.synthesis_agent.log_agent_decision", lambda **kw: None)

    docs = [{"id": "PMID:42", "title": "T", "abstract": "A"}]
    state = _base_state(pubmed_docs=docs)
    result = synthesise_node(state)
    assert "PMID:42" in result["sources"]
    assert "Synthesis text" in result["synthesis"]
