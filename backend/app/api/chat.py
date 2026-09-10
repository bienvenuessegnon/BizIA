from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.auth import current_user
from app.services.chat import answer_from_analysis
from app.services.store import get_user_store

router = APIRouter()


class ChatMessage(BaseModel):
    message: str = Field(min_length=1)


@router.post("/messages")
def chat_message(payload: ChatMessage, user: dict = Depends(current_user)) -> dict:
    answered = answer_from_analysis(
        payload.message, get_user_store(user["id"]).get_last_analysis()
    )
    return {
        "reply": answered["reply"],
        "grounded": answered["grounded"],
        "user_message": payload.message,
    }
