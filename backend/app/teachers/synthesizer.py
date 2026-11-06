"""Instant deterministic coach response synthesizer for offline zero-latency pedagogy."""
from typing import List
from backend.app.schemas.coach import (
    CoachExplainResponse,
    FretTargetSuggestion,
    PracticeDrillStep,
    TeacherPersonaEnum,
)
from backend.app.schemas.rag import GuitarTheoryChunk
from backend.app.teachers.context_builder import HarmonicContext
from backend.app.teachers.personas import get_persona


def synthesize_coach_response(
    context: HarmonicContext,
    chunk: GuitarTheoryChunk,
    persona_id: TeacherPersonaEnum,
    retrieval_score: float,
) -> CoachExplainResponse:
    """Synthesizes an authoritative, highly musical guitar coaching response without requiring an external LLM."""
    persona = get_persona(persona_id)
    active = context.active_chord
    prev = context.prev_chord or context.full_progression[0]
    key_display = f"{context.key} {context.mode}"

    # 1. Harmonic Summary
    harmonic_summary = (
        f"In the key of {key_display}, the {active} chord functions as the {context.roman_numeral} "
        f"({context.harmonic_function}). "
        f"{context.pedagogical_insight}"
    )

    # 2. Persona-Flavored "The Musical Why"
    musical_why_paragraphs = [chunk.the_musical_why]

    if persona_id == TeacherPersonaEnum.BLUES_ROCK:
        musical_why_paragraphs.append(
            f"🎸 {persona.name}'s Take: 'Notice the immediate change in room temperature when {active} drops! "
            f"Instead of thrashing around trying to play 100 fast notes, milk the transition. "
            f"Keep your fingers calm in your home pentatonic box, and let that single color note breathe with slow, vocal vibrato.'"
        )
    elif persona_id == TeacherPersonaEnum.JAZZ_FUSION:
        musical_why_paragraphs.append(
            f"🎷 {persona.name}'s Take: 'Notice the voice-leading economy here. "
            f"Moving from {prev} to {active} doesn't require jumping up and down the neck. "
            f"The essential guide tones resolve smoothly by a half-step. "
            f"Good soloists play scales over chords; master soloists outline the harmony through minimal movement.'"
        )
    else:  # NEO_SOUL
        musical_why_paragraphs.append(
            f"🕊️ {persona.name}'s Take: 'This chord change is pure liquid soul. "
            f"Anchor your thumb on the root note and let your index and middle fingers float over strings 2 and 3. "
            f"Use a subtle hammer-on or slide into the color note to create that crying R&B vocal sigh.'"
        )

    the_musical_why = "\n\n".join(musical_why_paragraphs)

    # 3. Fretboard GPS
    caged_info = "; ".join(chunk.caged_anchors)
    scales_info = ", ".join(chunk.soloing_scales)
    fretboard_gps = (
        f"Hand Anchors: {caged_info}. "
        f"Recommended Soloing Modes: {scales_info}. "
        f"Hero Motion: {chunk.instant_card.hero_move}"
    )

    # 4. Actionable 3-Step Practice Drill
    drill_steps: List[PracticeDrillStep] = [
        PracticeDrillStep(
            step_number=1,
            action=f"Start the backing band comping loop in the app ({' -> '.join(context.full_progression)}).",
            fretboard_focus="Listen for the chord transitions and lock your foot into the groove.",
        ),
        PracticeDrillStep(
            step_number=2,
            action=f"Play your familiar home-base scale over the early chords without moving your hand position.",
            fretboard_focus=f"Anchor your fretting hand in the nearest CAGED position.",
        ),
        PracticeDrillStep(
            step_number=3,
            action=f"The exact instant {active} hits, land squarely on the target tone ({chunk.instant_card.target_degree_motion}).",
            fretboard_focus=f"Execute: {chunk.instant_card.hero_move}",
        ),
    ]

    return CoachExplainResponse(
        instant_card=chunk.instant_card,
        harmonic_summary=harmonic_summary,
        the_musical_why=the_musical_why,
        fretboard_gps=fretboard_gps,
        target_notes=context.target_notes,
        practice_drill=drill_steps,
        twin_songs=chunk.instant_card.twin_songs,
        persona_used=persona,
        retrieved_concept_id=chunk.id,
        retrieval_score=retrieval_score,
        engine_mode="deterministic_fallback",
    )
