"""Pydantic schemas for the Guitar Theory Kingdom RAG and Knowledge Base engine."""
from typing import List, Optional
from pydantic import BaseModel, Field


class InstantCard(BaseModel):
    """Tier-2 instantaneous insight card for 10ms UI popups without LLM latency."""
    vibe: str = Field(..., description="Short emotional and musical character (e.g., 'Bittersweet nostalgic pull')")
    hero_move: str = Field(..., description="1-sentence physical fretboard action (e.g., 'Slide finger down 1 fret from Major 3rd to Minor 3rd')")
    twin_songs: List[str] = Field(default_factory=list, description="Famous tracks exhibiting this move")
    target_degree_motion: str = Field(..., description="Specific degree motion, e.g. '3 -> b3 (E -> Eb)'")


class GuitarTheoryChunk(BaseModel):
    """Complete specification of a pedagogical guitar harmony knowledge chunk."""
    id: str = Field(..., description="Unique slug, e.g. 'concept_modal_interchange_minor_iv'")
    title: str = Field(..., description="Lesson title, e.g. 'The Minor iv Chord (Modal Interchange)'")
    harmonic_category: str = Field(..., description="Category: 'modal_interchange', 'secondary_dominant', 'tritone_sub', 'blues_shift', 'voice_leading', 'embellishment', 'upper_extensions', 'passing_chord', 'modal_shift'")
    roman_numeral: str = Field(..., description="Roman numeral or progression token, e.g. 'iv', 'V/V', 'subV7'")
    target_chords: List[str] = Field(default_factory=list, description="Matching chord patterns, e.g. ['iv', 'ivm7', 'iv6', 'Cm', 'Fm']")
    instant_card: InstantCard
    the_musical_why: str = Field(..., description="Pedagogical explanation of harmonic tension, release, and psychology")
    caged_anchors: List[str] = Field(default_factory=list, description="Specific CAGED box and string coordinates")
    soloing_scales: List[str] = Field(default_factory=list, description="Top recommended soloing scales/modes")
    practice_drill: str = Field(..., description="3-step actionable guitar practice routine")
    difficulty: str = Field(default="intermediate", description="'beginner', 'intermediate', 'advanced'")
    tags: List[str] = Field(default_factory=list, description="Searchable tags for indexing and filtering")


class TheoryQueryRequest(BaseModel):
    """Payload for querying the guitar theory vector database."""
    query: str = Field(..., description="Natural language question or chord change (e.g. 'Why does Creep sound sad on Cm?')")
    harmonic_category: Optional[str] = Field(default=None, description="Optional category filter")
    limit: int = Field(default=3, ge=1, le=10, description="Number of results to retrieve")


class ScoredTheoryChunk(BaseModel):
    """Retrieved theory chunk with similarity score."""
    chunk: GuitarTheoryChunk
    score: float = Field(..., ge=0.0, le=1.0, description="Cosine similarity score")


class TheorySearchResponse(BaseModel):
    """Response containing retrieved theory chunks and instant cards."""
    results: List[ScoredTheoryChunk]
    instant_card: Optional[InstantCard] = None
    query: str
    total_found: int
