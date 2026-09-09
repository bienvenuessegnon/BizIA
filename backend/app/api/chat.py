from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.chat import answer_from_analysis
from app.services.store import get_store

router = APIRouter()


class ChatMessage(BaseModel):
    message: str = Field(min_length=1)


@router.post("/messages")
def chat_message(payload: ChatMessage) -> dict:
    answered = answer_from_analysis(payload.message, get_store().get_last_analysis())
    return {
        "reply": answered["reply"],
        "grounded": answered["grounded"],
        "user_message": payload.message,
    }
