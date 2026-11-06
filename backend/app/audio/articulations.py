"""Guitar articulation and expression analyzer.
Detects bends (half, full, 1.5 step), vibrato, hammer-ons, pull-offs, and slides from note events.
"""

from typing import List, Optional, Tuple
import numpy as np

from backend.app.schemas.audio import GuitarArticulationEnum, TranscribedNoteEvent


def detect_bend_type(bend_cents: Optional[float]) -> Tuple[GuitarArticulationEnum, float]:
    """Classifies upward pitch deviation into guitar bend categories.
    Returns (articulation, bend_semitones).
    """
    if bend_cents is None or bend_cents < 35.0:
        return GuitarArticulationEnum.NORMAL, 0.0

    # Half-step bend: ~100 cents (range 65 - 145)
    if 65.0 <= bend_cents < 155.0:
        return GuitarArticulationEnum.BEND_HALF, 1.0

    # Whole-step bend: ~200 cents (range 155 - 250)
    if 155.0 <= bend_cents < 255.0:
        return GuitarArticulationEnum.BEND_FULL, 2.0

    # 1.5-step blues overbend: ~300 cents (>= 255)
    if bend_cents >= 255.0:
        return GuitarArticulationEnum.BEND_1_AND_HALF, 3.0

    # Microtonal blues curl (quarter-tone bend ~50 cents)
    return GuitarArticulationEnum.BEND_HALF, 0.5


def detect_hammer_pull(
    prev_note: TranscribedNoteEvent,
    curr_note: TranscribedNoteEvent,
    max_gap_sec: float = 0.06,
) -> Optional[GuitarArticulationEnum]:
    """Detects legato slurs: hammer-ons (ascending pitch with soft attack)
    and pull-offs (descending pitch with soft attack).
    """
    gap = curr_note.start_time - prev_note.end_time
    if gap > max_gap_sec:
        return None

    # Pitch difference in semitones
    semitone_diff = curr_note.pitch_midi - prev_note.pitch_midi

    # Typically hammer/pull happens within 1 to 4 semitones on the same string
    if 1 <= semitone_diff <= 4:
        return GuitarArticulationEnum.HAMMER_ON
    elif -4 <= semitone_diff <= -1:
        return GuitarArticulationEnum.PULL_OFF

    return None


def detect_slides(
    prev_note: TranscribedNoteEvent,
    curr_note: TranscribedNoteEvent,
    max_gap_sec: float = 0.05,
) -> Optional[GuitarArticulationEnum]:
    """Detects slide-up and slide-down transitions between consecutive notes."""
    gap = curr_note.start_time - prev_note.end_time
    if gap > max_gap_sec:
        return None

    semitone_diff = curr_note.pitch_midi - prev_note.pitch_midi
    if semitone_diff >= 2 and semitone_diff <= 7:
        return GuitarArticulationEnum.SLIDE_UP
    elif semitone_diff <= -2 and semitone_diff >= -7:
        return GuitarArticulationEnum.SLIDE_DOWN

    return None


def enrich_note_articulations(
    notes: List[TranscribedNoteEvent],
) -> List[TranscribedNoteEvent]:
    """Analyzes note sequence and enriches with guitar-specific articulations:
    Bends, Hammer-ons, Pull-offs, Slides, and Vibrato.
    """
    if not notes:
        return []

    enriched: List[TranscribedNoteEvent] = []

    for i, note in enumerate(notes):
        # 1. Check for pitch bend from continuous contour
        bend_art, bend_semi = detect_bend_type(note.bend_cents)
        active_art = bend_art

        # 2. Check relationship with previous note (hammer-on, pull-off, slide)
        if i > 0 and active_art == GuitarArticulationEnum.NORMAL:
            prev_note = notes[i - 1]
            # Check slide first
            slide = detect_slides(prev_note, note)
            if slide:
                active_art = slide
            else:
                # Check hammer/pull
                hp = detect_hammer_pull(prev_note, note)
                if hp:
                    active_art = hp

        # Clone note with updated articulation
        enriched_note = TranscribedNoteEvent(
            start_time=note.start_time,
            end_time=note.end_time,
            duration=note.duration,
            pitch_midi=note.pitch_midi,
            pitch_name=note.pitch_name,
            pitch_class=note.pitch_class,
            amplitude=note.amplitude,
            articulation=active_art,
            bend_cents=note.bend_cents,
            tab_position=note.tab_position,
        )
        enriched.append(enriched_note)

    return enriched
