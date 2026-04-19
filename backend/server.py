import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from agent import run_agent
from llm_interface import get_available_models
from pathlib import Path

# This finds the folder where server.py lives, goes up one level, then into frontend
BASE_DIR = Path(__file__).parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
INDEX_FILE = FRONTEND_DIR / "index.html"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    model: str | None = None

@app.get("/api/models")
async def list_models():
    return {"models": get_available_models()}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        reply = run_agent(request.message, model=request.model)
        return {"reply": reply, "source": request.model or "Agent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def serve_index():
    return FileResponse(str(INDEX_FILE)) if INDEX_FILE.exists() else HTMLResponse("404", 404)

app.mount("/frontend", StaticFiles(directory=str(FRONTEND_DIR)), name="frontend")

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
