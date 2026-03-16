import os
import logging
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, END
from langsmith_integration import setup_tracing, trace_agent_run

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Tracing if enabled
if "${{ enableLangsmith }}" == "true":
    setup_tracing(project_name="${{ name }}")

class AgentState(TypedDict):
    input: str
    output: str
    steps: list[str]

@trace_agent_run(name="${{ name }}_node")
def call_model(state: AgentState):
    logger.info(f"Agent ${{ name }} processing input: {state['input']}")
    # Logic for ${{ framework }} would go here
    return {"output": f"Processed by ${{ name }}: {state['input']}", "steps": ["call_model"]}

# Define Graph
builder = StateGraph(AgentState)
builder.add_node("agent", call_model)
builder.set_entry_point("agent")
builder.add_edge("agent", END)
runnable = builder.compile()

if __name__ == "__main__":
    result = runnable.invoke({"input": "Hello from Golden Path!", "steps": []})
    print(result["output"])
