from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ChatMessage(BaseModel):
    message: str


@router.post("/messages")
def chat_message(payload: ChatMessage) -> dict[str, str]:
    """Dialogue avec les données — app.ai (LLM / RAG)."""
    return {
        "reply": "Moteur conversationnel à implémenter.",
        "user_message": payload.message,
    }
