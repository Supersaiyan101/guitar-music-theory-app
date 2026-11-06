"""Deterministic harmonic context builder for the AI Guitar Coach."""
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from backend.app.schemas.coach import CoachExplainRequest, FretTargetSuggestion
from backend.app.schemas.theory import HarmonicFunction, ProgressionAnalysisResult
from backend.app.theory.pitch import note_to_pitch_class
from backend.app.theory.progression import analyze_progression

# Standard guitar open-string pitch classes: [High E, B, G, D, A, Low E]
STANDARD_OPEN_STRING_PCS = [4, 11, 7, 2, 9, 4]


@dataclass
class HarmonicContext:
    """Consolidated deterministic context for the AI Guitar Coach."""
    key: str
    mode: str
    active_chord: str
    active_index: int
    prev_chord: Optional[str]
    roman_numeral: str
    harmonic_function: str
    pedagogical_insight: str
    chord_tones: List[str]
    guide_tones: List[str]
    common_tones: List[str]
    moving_voices: List[dict]
    recommended_scales: dict
    target_notes: List[FretTargetSuggestion]
    retrieval_query: str
    category_filter: Optional[str]
    full_progression: List[str]


def _find_fret_coordinates_for_note(note: str, target_zone: Optional[int] = None) -> List[Tuple[int, int]]:
    """Calculates all physical string & fret coordinates (strings 1-6, frets 0-24) for a note."""
    note_pc = note_to_pitch_class(note)
    coordinates: List[Tuple[int, int]] = []

    for s_idx, open_pc in enumerate(STANDARD_OPEN_STRING_PCS):
        string_num = s_idx + 1  # 1-based (1 = High E)
        first_fret = (note_pc - open_pc) % 12
        coordinates.append((string_num, first_fret))
        if first_fret + 12 <= 24:
            coordinates.append((string_num, first_fret + 12))

    if target_zone is not None:
        # Sort by proximity to target_zone, preferring melody strings 1, 2, 3
        coordinates.sort(
            key=lambda coord: (
                abs(coord[1] - target_zone),
                coord[0],  # lower string number = higher pitch melody string
            )
        )
    else:
        # Default sort: prioritize strings 1, 2, 3 in comfortable frets 3-12
        coordinates.sort(
            key=lambda coord: (
                0 if 3 <= coord[1] <= 12 else 1,
                coord[0],
            )
        )

    return coordinates


def build_harmonic_context(request: CoachExplainRequest) -> HarmonicContext:
    """Analyzes progression and builds authoritative guitar context for RAG and persona teachers."""
    progression = request.progression
    active_idx = min(request.active_chord_index, len(progression) - 1)
    active_chord_sym = progression[active_idx]

    # Deterministic progression analysis
    analysis_result: ProgressionAnalysisResult = analyze_progression(
        chords=progression,
        key=request.key,
        mode=request.mode,
    )

    detected_key = analysis_result.key
    detected_mode = analysis_result.mode
    chord_analysis = analysis_result.chords[active_idx]

    prev_chord_sym = None
    if active_idx > 0:
        prev_chord_sym = progression[active_idx - 1]
    elif request.from_chord:
        prev_chord_sym = request.from_chord

    # Voice leading extraction
    moving_voices = []
    if prev_chord_sym and chord_analysis.voice_leading_to_next:
        for step in chord_analysis.voice_leading_to_next:
            moving_voices.append({
                "from_note": step.from_note,
                "from_degree": step.from_degree,
                "to_note": step.to_note,
                "to_degree": step.to_degree,
                "semitone_distance": step.semitone_distance,
                "is_guide_tone": step.is_guide_tone_resolution,
            })

    # Physical fret targets calculation
    target_suggestions: List[FretTargetSuggestion] = []
    primary_target_note = chord_analysis.guide_tones[0] if chord_analysis.guide_tones else chord_analysis.root
    coords = _find_fret_coordinates_for_note(primary_target_note, target_zone=request.target_fret_zone)

    # Take top 3 most ergonomic string/fret coordinates
    for string_num, fret_num in coords[:3]:
        # Formulate guitar-specific technique guidance
        technique = "target"
        desc = f"Fret {primary_target_note} on string {string_num}, fret {fret_num}"

        if chord_analysis.roman_numeral == "iv" and primary_target_note in ["Eb", "Ab", "Bb", "F"]:
            technique = "slide"
            desc = f"Slide down 1 fret from fret {fret_num + 1} to fret {fret_num} on string {string_num} to land on {primary_target_note} ({chord_analysis.symbol} color 3rd)"
        elif chord_analysis.harmonic_function == HarmonicFunction.SECONDARY_DOMINANT:
            technique = "half_bend"
            desc = f"Target {primary_target_note} on string {string_num}, fret {fret_num} — sharp leading tone pulling up to next root"

        target_suggestions.append(
            FretTargetSuggestion(
                string=string_num,
                fret=fret_num,
                note=primary_target_note,
                interval="3" if len(chord_analysis.chord_tones) > 1 and primary_target_note == chord_analysis.chord_tones[1] else "guide",
                technique=technique,
                description=desc,
            )
        )

    # Category filter mapping
    category_filter = None
    fn = chord_analysis.harmonic_function
    if fn == HarmonicFunction.MODAL_INTERCHANGE:
        category_filter = "modal_interchange"
    elif fn == HarmonicFunction.SECONDARY_DOMINANT:
        category_filter = "secondary_dominant"
    elif fn == HarmonicFunction.TRITONE_SUB:
        category_filter = "tritone_sub"

    # Semantic retrieval query construction
    query_parts = [
        f"Harmonic function of {active_chord_sym} in {detected_key} {detected_mode}:",
        f"Roman numeral {chord_analysis.roman_numeral}, {chord_analysis.harmonic_function.value}.",
        f"Chord tones: {', '.join(chord_analysis.chord_tones)}.",
    ]
    if prev_chord_sym:
        query_parts.append(f"Moving from {prev_chord_sym} to {active_chord_sym}.")
    if moving_voices:
        voice_str = ", ".join([f"{v['from_note']} -> {v['to_note']}" for v in moving_voices])
        query_parts.append(f"Voice leading shifts: {voice_str}.")
    if request.user_question:
        query_parts.append(f"User question: {request.user_question}")

    retrieval_query = " ".join(query_parts)

    return HarmonicContext(
        key=detected_key,
        mode=detected_mode,
        active_chord=active_chord_sym,
        active_index=active_idx,
        prev_chord=prev_chord_sym,
        roman_numeral=chord_analysis.roman_numeral,
        harmonic_function=chord_analysis.harmonic_function.value,
        pedagogical_insight=chord_analysis.pedagogical_insight,
        chord_tones=chord_analysis.chord_tones,
        guide_tones=chord_analysis.guide_tones,
        common_tones=chord_analysis.common_tones_with_next,
        moving_voices=moving_voices,
        recommended_scales=chord_analysis.recommended_scales,
        target_notes=target_suggestions,
        retrieval_query=retrieval_query,
        category_filter=category_filter,
        full_progression=progression,
    )
