from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ChatMessage(BaseModel):
    message: str


@router.post("/messages")
def chat_message(payload: ChatMessage) -> dict:
    """TODO(uriel): services.chat.answer_from_analysis(message, store.get_last_analysis())."""
    return {
        "reply": "",
        "grounded": False,
        "user_message": payload.message,
        "status": "not_implemented",
    }
