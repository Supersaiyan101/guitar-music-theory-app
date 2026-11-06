"""FastAPI router endpoints for the AI Guitar Coach and Teacher Personas."""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from backend.app.schemas.coach import (
    CoachExplainRequest,
    CoachExplainResponse,
    PersonasResponse,
)
from backend.app.schemas.rag import InstantCard
from backend.app.teachers.advisor import get_coach_advisor
from backend.app.teachers.personas import get_all_personas

router = APIRouter(prefix="/api/coach", tags=["Guitar Coach"])


@router.get("/personas", response_model=PersonasResponse)
def list_personas():
    """Lists all available AI Guitar Coach personas and their musical philosophies."""
    return PersonasResponse(personas=get_all_personas())


@router.post("/explain", response_model=CoachExplainResponse)
def explain_chord_transition(request: CoachExplainRequest):
    """Explains why a chord change works and delivers fretboard targets & 3-step practice drills."""
    try:
        advisor = get_coach_advisor()
        return advisor.explain(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Guitar Coach analysis failed: {str(e)}")


@router.post("/explain/stream")
async def stream_explain_chord_transition(request: CoachExplainRequest):
    """Streams real-time word-by-word coaching advice via Server-Sent Events (SSE)."""
    try:
        advisor = get_coach_advisor()
        return StreamingResponse(
            advisor.stream_explain(request),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Streaming failed: {str(e)}")


@router.get("/instant-card", response_model=Optional[InstantCard])
def get_instant_card(
    chord: Optional[str] = Query(None, description="Chord symbol, e.g. 'Cm' or 'Db7'"),
    roman: Optional[str] = Query(None, description="Roman numeral token, e.g. 'iv' or 'V/vi'"),
    category: Optional[str] = Query(None, description="Harmonic category, e.g. 'modal_interchange'"),
):
    """Tier-2 lightning lookup (< 0.5ms) from RAM cache for instant practice popups."""
    advisor = get_coach_advisor()
    card = advisor.vector_store.get_instant_card(
        chord_symbol=chord,
        roman_numeral=roman,
        harmonic_category=category,
    )
    return card
