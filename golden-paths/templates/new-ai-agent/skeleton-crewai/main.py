import os
from crewai import Agent, Crew, Process, Task
from langchain_openai import ChatOpenAI

# Set up governed LiteLLM proxy LLM binding
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.0,
    openai_api_key=os.getenv("LITELLM_API_KEY", "default-key"),
    openai_api_base="http://litellm:4000"
)

# Define CrewAI agents
researcher = Agent(
    role="Senior Biomedical Researcher",
    goal="Extract high-fidelity clinical facts from raw sources",
    backstory="You are an expert molecular biologist specializing in clinical trials data.",
    verbose=True,
    llm=llm
)

writer = Agent(
    role="Evidence Synthesizer",
    goal="Synthesize research facts into executive summaries",
    backstory="You compile rigorous scientific facts into accessible clinical trial reviews.",
    verbose=True,
    llm=llm
)

# Tasks
task_research = Task(
    description="Analyze clinical reports for GLP-1 trials and identify side-effects.",
    expected_output="A list of bullet points detailing side-effects and statistical significance.",
    agent=researcher
)

task_write = Task(
    description="Compile side-effect findings into a structured summary.",
    expected_output="A clean markdown document ready for audit validation.",
    agent=writer
)

crew = Crew(
    agents=[researcher, writer],
    tasks=[task_research, task_write],
    process=Process.sequential
)

if __name__ == "__main__":
    result = crew.kickoff()
    print("Crew output:")
    print(result)
