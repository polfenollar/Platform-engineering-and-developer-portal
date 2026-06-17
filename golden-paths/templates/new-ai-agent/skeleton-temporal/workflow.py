from datetime import timedelta
from temporalio import workflow, activity
from temporalio.common import RetryPolicy

@activity.defn
async def fetch_articles_activity(query: str) -> str:
    # Simulates article fetching
    return f"Retrieved PubMed data for: {query}"

@activity.defn
async def run_agent_synthesis_activity(articles: str) -> str:
    # Simulates agent synthesis run
    return f"Synthesized report from: {articles}"

@workflow.defn
class EvidenceSynthesisWorkflow:
    @workflow.run
    async def run(self, query: str) -> str:
        # Enforce retry policies and timeouts mandated by platform guardrails
        retry_policy = RetryPolicy(
            initial_interval=timedelta(seconds=1),
            backoff_coefficient=5.0,
            maximum_attempts=3,
        )

        articles = await workflow.execute_activity(
            fetch_articles_activity,
            query,
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy,
        )

        synthesis = await workflow.execute_activity(
            run_agent_synthesis_activity,
            articles,
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy,
        )

        return synthesis
