"""Pydantic schemas for the Guitar Coach engine, teacher personas, and RAG advice."""
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.rag import InstantCard


class TeacherPersonaEnum(str, Enum):
    """Available AI Guitar Coach personas."""
    BLUES_ROCK = "blues_rock"
    JAZZ_FUSION = "jazz_fusion"
    NEO_SOUL = "neo_soul"


class PersonaProfile(BaseModel):
    """Public profile for a guitar teacher persona."""
    id: TeacherPersonaEnum
    name: str = Field(..., description="Display name, e.g. 'The Blues-Rock Veteran'")
    avatar: str = Field(..., description="Emoji avatar icon, e.g. '🎸'")
    hero_philosophy: str = Field(..., description="Core pedagogical philosophy")
    style_influences: List[str] = Field(default_factory=list, description="Legendary guitarists embodying this style")
    favorite_moves: List[str] = Field(default_factory=list, description="Iconic techniques and fretboard concepts")


class FretTargetSuggestion(BaseModel):
    """Specific physical guitar fretboard target recommendation."""
    string: int = Field(..., ge=1, le=6, description="Guitar string 1 (High E) to 6 (Low E)")
    fret: int = Field(..., ge=0, le=24, description="Fret number (0 = open)")
    note: str = Field(..., description="Spelled pitch name, e.g. 'Eb'")
    interval: str = Field(..., description="Role in active chord: '3', 'b3', 'b7', '7'")
    technique: str = Field(default="target", description="'slide', 'half_bend', 'whole_bend', 'hammer', 'target'")
    description: str = Field(..., description="Human instruction, e.g. 'Slide from fret 7 to 8 on B string'")


class PracticeDrillStep(BaseModel):
    """Step inside an actionable 3-step practice drill."""
    step_number: int = Field(..., ge=1, le=5)
    action: str = Field(..., description="Clear physical instruction to execute on guitar")
    fretboard_focus: str = Field(..., description="Target string, fret, or CAGED box")


class CoachExplainRequest(BaseModel):
    """Payload for asking the Guitar Coach for harmonic advice over a chord change."""
    progression: List[str] = Field(..., min_length=1, description="List of chords in the progression, e.g. ['G', 'B7', 'C', 'Cm']")
    active_chord_index: int = Field(default=0, ge=0, description="Index of the chord currently playing or being analyzed")
    from_chord: Optional[str] = Field(default=None, description="Previous chord symbol if analyzing a specific transition")
    to_chord: Optional[str] = Field(default=None, description="Current chord symbol being transitioned into")
    key: Optional[str] = Field(default=None, description="Tonal center key (e.g. 'G'). If omitted, automatically detected")
    mode: Optional[str] = Field(default="major", description="'major' or 'minor'")
    persona: TeacherPersonaEnum = Field(default=TeacherPersonaEnum.BLUES_ROCK, description="Desired teacher persona")
    user_question: Optional[str] = Field(default=None, description="Optional custom user question (e.g. 'Why does this sound bittersweet?')")
    target_fret_zone: Optional[int] = Field(default=None, ge=0, le=24, description="Optional hand position focus fret")


class CoachExplainResponse(BaseModel):
    """Complete structured advice returned by the Guitar Coach."""
    instant_card: InstantCard = Field(..., description="Tier-2 instant insight for snappy UI popups")
    harmonic_summary: str = Field(..., description="Concise harmonic function breakdown (e.g. 'Cm is the minor iv chord')")
    the_musical_why: str = Field(..., description="Deep explanation of psychological and harmonic tension/release")
    fretboard_gps: str = Field(..., description="Physical hand position and CAGED anchor advice")
    target_notes: List[FretTargetSuggestion] = Field(default_factory=list, description="Exact fretboard landing targets")
    practice_drill: List[PracticeDrillStep] = Field(default_factory=list, description="Concrete 3-step practice routine")
    twin_songs: List[str] = Field(default_factory=list, description="Famous songs using this identical move")
    persona_used: PersonaProfile = Field(..., description="Teacher persona that delivered the coaching")
    retrieved_concept_id: str = Field(..., description="ID of the matching theory knowledge chunk in Qdrant")
    retrieval_score: float = Field(..., description="Vector similarity match score")
    engine_mode: str = Field(default="deterministic_fallback", description="'llm_stream' or 'deterministic_fallback'")


class PersonasResponse(BaseModel):
    """List of all available teacher personas."""
    personas: List[PersonaProfile]
