from langchain.tools import tool

@tool
def get_research_paper_details(doi: str) -> str:
    """Retrieves full research paper text and details using DOI."""
    return f"Retrieved content for DOI: {doi}. Found evidence of efficacy in clinical trial data."

def get_tools():
    return [get_research_paper_details]
