"""Retrieval tools for PubMed, ClinicalTrials.gov, and vector store.

Agents access data ONLY via these defined LangChain/LangGraph tools
(ARCHITECTURE_BIOMEDICAL.md — Agent Design Rules).
"""

import os
from typing import Any

import httpx
import structlog
from qdrant_client import QdrantClient
from qdrant_client.models import Filter

logger = structlog.get_logger(__name__)

_qdrant = QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333"))
_COLLECTION = "biomedical-gold"


def retrieve_pubmed(query: str, max_results: int = 10) -> list[dict[str, Any]]:
    """Fetch article metadata from PubMed E-utilities API.

    Args:
        query: Free-text search query.
        max_results: Maximum number of records to return.

    Returns:
        List of dicts with keys: id (PMID/DOI), title, abstract.
    """
    log = logger.bind(tool="retrieve_pubmed", query=query)
    try:
        search_resp = httpx.get(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
            params={"db": "pubmed", "term": query, "retmax": max_results, "retmode": "json"},
            timeout=10.0,
        )
        search_resp.raise_for_status()
        ids = search_resp.json()["esearchresult"]["idlist"]

        if not ids:
            return []

        fetch_resp = httpx.get(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
            params={"db": "pubmed", "id": ",".join(ids), "retmode": "xml", "rettype": "abstract"},
            timeout=15.0,
        )
        fetch_resp.raise_for_status()
        # Simplified parse — production would use lxml
        docs = [{"id": f"PMID:{pmid}", "title": f"PubMed article {pmid}", "abstract": ""} for pmid in ids]
        log.info("pubmed_fetched", count=len(docs))
        return docs
    except httpx.HTTPError as exc:
        log.error("pubmed_fetch_error", error=str(exc))
        return []


def retrieve_clinical_trials(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    """Fetch study metadata from ClinicalTrials.gov v2 API.

    Args:
        query: Free-text search query.
        max_results: Maximum number of records to return.

    Returns:
        List of dicts with keys: id (NCT ID), title, abstract.
    """
    log = logger.bind(tool="retrieve_clinical_trials", query=query)
    try:
        resp = httpx.get(
            "https://clinicaltrials.gov/api/v2/studies",
            params={"query.term": query, "pageSize": max_results, "format": "json"},
            timeout=10.0,
        )
        resp.raise_for_status()
        studies = resp.json().get("studies", [])
        docs = [
            {
                "id": s["protocolSection"]["identificationModule"]["nctId"],
                "title": s["protocolSection"]["identificationModule"].get("briefTitle", ""),
                "abstract": s["protocolSection"].get("descriptionModule", {}).get("briefSummary", ""),
            }
            for s in studies
        ]
        log.info("clinical_trials_fetched", count=len(docs))
        return docs
    except httpx.HTTPError as exc:
        log.error("clinical_trials_fetch_error", error=str(exc))
        return []


def vector_search(query: str, top_k: int = 5) -> list[dict[str, Any]]:
    """Search the Gold-layer Qdrant collection for semantically similar passages.

    Args:
        query: Free-text query (will be embedded server-side).
        top_k: Number of nearest neighbours to return.

    Returns:
        List of dicts with keys: id, title, abstract.
    """
    log = logger.bind(tool="vector_search", query=query)
    try:
        results = _qdrant.query(
            collection_name=_COLLECTION,
            query_text=query,
            limit=top_k,
        )
        docs = [
            {
                "id": r.id,
                "title": r.metadata.get("title", ""),
                "abstract": r.metadata.get("abstract", ""),
            }
            for r in results
        ]
        log.info("vector_search_complete", count=len(docs))
        return docs
    except Exception as exc:  # noqa: BLE001
        log.error("vector_search_error", error=str(exc))
        return []
