# ==============================================================================
# Langsmith Integration — SDK Wrapper for Agent Tracing
# ==============================================================================
"""
Langsmith integration wrapper for AI agent tracing.

This module provides a standardized way to integrate Langsmith tracing
into both Veyor AI agents and BioMedical AI agents.

Usage:
    from langsmith_integration import setup_tracing, trace_agent_run

    # Initialize tracing (call once at startup)
    setup_tracing(project_name="veyor-agents")

    # Trace an agent run
    @trace_agent_run(name="support_chat")
    async def handle_chat(user_message: str) -> str:
        ...
"""

import os
import functools
import logging
from typing import Any, Callable, Optional

logger = logging.getLogger(__name__)


def setup_tracing(
    project_name: str,
    environment: Optional[str] = None,
) -> bool:
    """
    Initialize Langsmith tracing.

    Args:
        project_name: Langsmith project name (e.g., 'veyor-agents', 'biomedical-agents')
        environment: Deployment environment (dev, staging, prod)

    Returns:
        True if tracing is enabled, False otherwise
    """
    api_key = os.getenv("LANGCHAIN_API_KEY")
    if not api_key:
        logger.warning(
            "LANGCHAIN_API_KEY not set. Langsmith tracing disabled. "
            "Set LANGCHAIN_API_KEY and LANGCHAIN_TRACING_V2=true to enable."
        )
        return False

    os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
    os.environ.setdefault("LANGCHAIN_PROJECT", project_name)

    if environment:
        os.environ.setdefault("LANGCHAIN_TAGS", f"env:{environment}")

    logger.info(
        "Langsmith tracing enabled for project '%s' (env: %s)",
        project_name,
        environment or "unknown",
    )
    return True


def trace_agent_run(
    name: str,
    run_type: str = "chain",
    tags: Optional[list[str]] = None,
) -> Callable:
    """
    Decorator to trace an agent function with Langsmith.

    Args:
        name: Name of the traced run
        run_type: Type of run (chain, tool, llm, retriever)
        tags: Additional tags for the run

    Returns:
        Decorated function
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            tracing_enabled = os.getenv("LANGCHAIN_TRACING_V2") == "true"
            if not tracing_enabled:
                return await func(*args, **kwargs)

            try:
                from langsmith import traceable

                traced_func = traceable(
                    name=name,
                    run_type=run_type,
                    tags=tags or [],
                )(func)
                return await traced_func(*args, **kwargs)
            except ImportError:
                logger.warning("langsmith package not installed. Running without tracing.")
                return await func(*args, **kwargs)

        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            tracing_enabled = os.getenv("LANGCHAIN_TRACING_V2") == "true"
            if not tracing_enabled:
                return func(*args, **kwargs)

            try:
                from langsmith import traceable

                traced_func = traceable(
                    name=name,
                    run_type=run_type,
                    tags=tags or [],
                )(func)
                return traced_func(*args, **kwargs)
            except ImportError:
                logger.warning("langsmith package not installed. Running without tracing.")
                return func(*args, **kwargs)

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
