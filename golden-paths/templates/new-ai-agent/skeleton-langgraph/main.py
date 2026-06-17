import os
from typing import TypedDict
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from state import AgentState

# Safe model configuration routing through internal LiteLLM gateway with temperature=0
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.0,
    openai_api_key=os.getenv("LITELLM_API_KEY", "default-key"),
    openai_api_base="http://litellm:4000"
)

def agent_node(state: AgentState):
    response = llm.invoke(f"Synthesize the following research query: {state['query']}")
    return {"messages": [response.content]}

# Build cognitive state machine graph
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.set_entry_point("agent")
workflow.add_edge("agent", END)

app = workflow.compile()

if __name__ == "__main__":
    result = app.invoke({"query": "Compare efficacy of GLP-1 agonists", "messages": []})
    print("Graph execution complete. Messages:", result["messages"])
