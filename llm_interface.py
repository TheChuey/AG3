import requests
from ollama import Client

# --- CONFIGURATION ---
OLLAMA_HOST = "http://localhost:11434"
SYSTEM_PROMPT = "You are a senior developer assistant using Qwen2.5-Coder logic."
GLOBAL_MEMORY = []

client = Client(host=OLLAMA_HOST)

def get_available_models():
    """
    Fetches the list of installed models from the local Ollama instance.
    """
    try:
        # Query Ollama's local tag API
        res = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=2)
        if res.status_code == 200:
            # Extract names from the model list
            return [m["name"] for m in res.json().get("models", [])]
        return []
    except Exception as e:
        print(f"[DEBUG] Could not fetch models: {e}")
        return []

def llm_interface(user_input: str, override_model: str | None = None):
    """
    Main chat interface. Uses the model selected by the user.
    """
    # If no model is selected or 'default' is picked, we try to find one
    if not override_model or override_model == "default":
        models = get_available_models()
        selected_model = models[0] if models else "qwen2.5-coder"
    else:
        selected_model = override_model
    
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(GLOBAL_MEMORY)
    messages.append({"role": "user", "content": user_input})

    try:
        response = client.chat(model=selected_model, messages=messages)
        reply = response['message']['content']

        # Update History
        GLOBAL_MEMORY.append({"role": "user", "content": user_input})
        GLOBAL_MEMORY.append({"role": "assistant", "content": reply})
        print(GLOBAL_MEMORY)  # Debugging line to check memory state
        return reply
    except Exception as e:
        return f"Error: {str(e)}. Ensure Ollama is running and '{selected_model}' is installed."