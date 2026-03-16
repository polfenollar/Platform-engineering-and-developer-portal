"""LangGraph state-machine agent for biomedical evidence synthesis.

Agent role: biomedical-core
Guardrail: ARCHITECTURE_BIOMEDICAL.md — Agent Layer rules apply.
"""

import logging
import os
from typing import Annotated, TypedDict

import structlog
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from src.tools.retrieval import retrieve_pubmed, retrieve_clinical_trials, vector_search
from src.tools.audit import log_agent_decision

logger = structlog.get_logger(__name__)

# ── LLM — lazy init so tests can mock before ANTHROPIC_API_KEY is required ───
_llm: ChatOpenAI | None = None


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(
            model="claude-sonnet-4-6",
            temperature=0,
            api_key=os.environ["ANTHROPIC_API_KEY"],
        )
    return _llm


class SynthesisState(TypedDict):
    """Immutable-ish agent state threaded through the graph."""

    query: str
    pubmed_docs: list[dict]
    clinical_docs: list[dict]
    vector_docs: list[dict]
    synthesis: str
    sources: list[str]          # DOI / NCT IDs — required by guardrails
    correlation_id: str
    audit_trail: list[str]


# ── Nodes ────────────────────────────────────────────────────────────────────

def retrieve_node(state: SynthesisState) -> SynthesisState:
    """Retrieve evidence from PubMed, ClinicalTrials, and vector store."""
    log = logger.bind(correlation_id=state["correlation_id"], node="retrieve")
    log.info("starting_retrieval", query=state["query"])

    pubmed = retrieve_pubmed(state["query"])
    clinical = retrieve_clinical_trials(state["query"])
    vector = vector_search(state["query"])

    log.info("retrieval_complete", pubmed_count=len(pubmed), clinical_count=len(clinical))
    return {
        **state,
        "pubmed_docs": pubmed,
        "clinical_docs": clinical,
        "vector_docs": vector,
        "audit_trail": state["audit_trail"] + ["retrieve: fetched evidence"],
    }


def synthesise_node(state: SynthesisState) -> SynthesisState:
    """Synthesise retrieved evidence — never hallucinate beyond retrieved docs."""
    log = logger.bind(correlation_id=state["correlation_id"], node="synthesise")

    all_docs = state["pubmed_docs"] + state["clinical_docs"] + state["vector_docs"]
    if not all_docs:
        log.warning("no_evidence_found")
        return {**state, "synthesis": "No evidence found for query.", "sources": []}

    context = "\n\n".join(
        f"[{d['id']}] {d['title']}\n{d['abstract']}" for d in all_docs[:20]
    )
    sources = [d["id"] for d in all_docs[:20]]

    prompt = (
        f"You are a biomedical evidence synthesis agent.\n"
        f"Synthesise ONLY the information present in the following retrieved documents.\n"
        f"Never introduce facts not found in the documents below.\n\n"
        f"Query: {state['query']}\n\n"
        f"Documents:\n{context}\n\n"
        f"Provide a structured synthesis with inline citations using the document IDs."
    )

    response = _get_llm().invoke(prompt)
    synthesis = response.content  # type: ignore[union-attr]

    log_agent_decision(
        agent="literature-synthesis-agent",
        node="synthesise",
        correlation_id=state["correlation_id"],
        sources=sources,
    )

    log.info("synthesis_complete", source_count=len(sources))
    return {
        **state,
        "synthesis": synthesis,
        "sources": sources,
        "audit_trail": state["audit_trail"] + [f"synthesise: used {len(sources)} sources"],
    }


def quality_node(state: SynthesisState) -> SynthesisState:
    """Gate: reject synthesis that cites zero sources (hallucination guard)."""
    log = logger.bind(correlation_id=state["correlation_id"], node="quality")
    if not state["sources"]:
        log.error("quality_check_failed", reason="no_sources")
        return {**state, "synthesis": "REJECTED: synthesis produced no citations."}
    log.info("quality_check_passed", sources=len(state["sources"]))
    return state


# ── Graph definition ─────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    """Build and compile the LangGraph state machine."""
    builder: StateGraph = StateGraph(SynthesisState)  # type: ignore[type-arg]
    builder.add_node("retrieve", retrieve_node)
    builder.add_node("synthesise", synthesise_node)
    builder.add_node("quality", quality_node)

    builder.set_entry_point("retrieve")
    builder.add_edge("retrieve", "synthesise")
    builder.add_edge("synthesise", "quality")
    builder.add_edge("quality", END)

    return builder.compile()


runnable = build_graph()
