from typing import TypedDict, List

class AgentState(TypedDict):
    query: str
    messages: List[str]
