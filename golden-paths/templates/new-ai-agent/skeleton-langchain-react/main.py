import os
from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from langchain import hub
from tools import get_tools

def main():
    # Enforce routing via LiteLLM proxy and temperature=0 as per platform guardrails
    llm = ChatOpenAI(
        model="gpt-4",
        temperature=0.0,
        openai_api_key=os.getenv("LITELLM_API_KEY", "default-key"),
        openai_api_base="http://litellm:4000"
    )

    # Setup Langsmith if configured
    if "${{ enableLangsmith }}" == "true":
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_PROJECT"] = "${{ name }}"
        os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGSMITH_API_KEY", "")

    tools = get_tools()
    prompt = hub.pull("hwchase17/react")

    agent = create_react_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    response = agent_executor.invoke({"input": "Perform evidence validation for research article 10.1001/jama.2026.0001"})
    print("Agent output:", response["output"])

if __name__ == "__main__":
    main()
