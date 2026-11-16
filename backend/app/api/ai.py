from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.ai_service import generate_ai_response

router = APIRouter(tags=["AI Copilot"])

class AIChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    conversation_history: Optional[List[Dict[str, str]]] = Field(default_factory=list)

class AIChatResponse(BaseModel):
    response: str
    provider: str
    model: str
    error_note: Optional[str] = None
    grounding_data: Optional[Dict[str, Any]] = None

@router.post("/ai/chat", response_model=AIChatResponse)
async def chat_with_copilot(payload: AIChatRequest, db: Session = Depends(get_db)):
    result = await generate_ai_response(
        db=db,
        user_query=payload.query,
        conversation_history=payload.conversation_history
    )
    return result
