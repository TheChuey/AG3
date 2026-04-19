from llm_interface import llm_interface

def run_agent(user_input: str, model: str | None = None) -> str:
    """
    Directs flow to the LLM interface. 
    In the future, add tool-calling logic here.
    """
    return llm_interface(user_input, override_model=model)