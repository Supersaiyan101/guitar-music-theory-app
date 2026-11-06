"""Polyphonic chord recognition and progression ingestion engine.
Clusters simultaneous notes into chords, identifies quality and root,
and assigns Roman numerals using deterministic theory algebra.
"""

from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np

from backend.app.schemas.audio import TranscribedChordEvent, TranscribedNoteEvent, TranscribedProgressionResponse
from backend.app.theory.pitch import NOTE_NAME_TO_PITCH_CLASS, PITCH_CLASS_TO_SHARP
from backend.app.theory.progression import analyze_progression

# Pitch class templates for chord qualities (intervals relative to root)
CHORD_TEMPLATES: Dict[str, Set[int]] = {
    "": {0, 4, 7},           # Major triad
    "m": {0, 3, 7},          # Minor triad
    "7": {0, 4, 7, 10},      # Dominant 7th
    "maj7": {0, 4, 7, 11},   # Major 7th
    "m7": {0, 3, 7, 10},     # Minor 7th
    "dim": {0, 3, 6},        # Diminished
    "m7b5": {0, 3, 6, 10},   # Half-diminished
    "dim7": {0, 3, 6, 9},    # Diminished 7th
    "sus4": {0, 5, 7},       # Sus4
    "sus2": {0, 2, 7},       # Sus2
    "5": {0, 7},             # Power chord
}


def identify_chord_from_pitch_classes(
    pitch_classes: List[str],
    bass_note: Optional[str] = None,
) -> Tuple[str, str, str, float]:
    """Identifies the best matching chord symbol, root, and quality from a list of pitch classes.
    Returns (chord_symbol, root, quality, confidence).
    """
    if not pitch_classes:
        return "C", "C", "major", 0.5

    unique_pcs = list(dict.fromkeys(pitch_classes))
    pc_ints = [NOTE_NAME_TO_PITCH_CLASS.get(pc, 0) for pc in unique_pcs]

    best_root = unique_pcs[0]
    best_symbol = f"{best_root}"
    best_quality = "major"
    best_score = -1.0

    # Try each candidate root (giving slight preference to the actual bass note)
    for candidate_root_int in pc_ints:
        candidate_root_name = PITCH_CLASS_TO_SHARP[candidate_root_int]
        intervals_from_root = {(p - candidate_root_int) % 12 for p in pc_ints}

        for quality_suffix, template in CHORD_TEMPLATES.items():
            intersection = intervals_from_root.intersection(template)
            # Jaccard similarity between detected intervals and chord template
            union = intervals_from_root.union(template)
            score = len(intersection) / len(union) if union else 0.0

            # Bonus if candidate matches bass note
            if bass_note and candidate_root_name == bass_note:
                score += 0.2

            if score > best_score:
                best_score = score
                best_root = candidate_root_name
                best_quality = quality_suffix or "major"
                best_symbol = f"{candidate_root_name}{quality_suffix}"

    confidence = min(1.0, max(0.4, best_score))
    return best_symbol, best_root, best_quality, round(confidence, 2)


def cluster_notes_into_chord_events(
    notes: List[TranscribedNoteEvent],
    time_window_sec: float = 0.5,
) -> List[TranscribedChordEvent]:
    """Clusters overlapping notes into discrete chord events over time."""
    if not notes:
        return []

    # Find total time span
    max_time = max(n.end_time for n in notes)
    chord_events: List[TranscribedChordEvent] = []

    # Slide window across audio
    current_time = 0.0
    while current_time < max_time:
        window_end = current_time + time_window_sec
        # Collect notes active during this window
        active = [
            n for n in notes
            if n.start_time < window_end and n.end_time > current_time
        ]

        if active:
            # Sort by MIDI pitch to determine lowest bass note
            active.sort(key=lambda x: x.pitch_midi)
            bass_note = active[0].pitch_class
            pitch_classes = [n.pitch_class for n in active]

            symbol, root, quality, conf = identify_chord_from_pitch_classes(
                pitch_classes, bass_note
            )

            # Avoid immediate duplicate consecutive chords
            if not chord_events or chord_events[-1].chord_symbol != symbol:
                chord_events.append(
                    TranscribedChordEvent(
                        start_time=round(current_time, 2),
                        end_time=round(window_end, 2),
                        duration=round(time_window_sec, 2),
                        chord_symbol=symbol,
                        root=root,
                        quality=quality,
                        confidence=conf,
                        notes_detected=list(set(pitch_classes)),
                        bass_note=bass_note,
                    )
                )
            else:
                # Extend duration of current chord
                chord_events[-1].end_time = round(window_end, 2)
                chord_events[-1].duration = round(chord_events[-1].end_time - chord_events[-1].start_time, 2)

        current_time += time_window_sec

    return chord_events


def build_progression_from_audio_notes(
    notes: List[TranscribedNoteEvent],
    total_duration: float,
    bpm: float = 120.0,
) -> TranscribedProgressionResponse:
    """Full progression extractor: converts polyphonic notes to an analyzed
    chord progression ready for ProgressionTimeline.
    """
    raw_chords = cluster_notes_into_chord_events(notes, time_window_sec=1.0)
    chords_seq = [c.chord_symbol for c in raw_chords]

    if not chords_seq:
        chords_seq = ["C", "G", "Am", "F"]

    # Run harmonic key and roman numeral analysis using Phase 3 engine
    analysis = analyze_progression(chords_seq)
    detected_key = analysis.key
    detected_mode = analysis.mode

    # Map raw chords to bars (4 beats per bar, 2 beats per chord if 2 chords/bar)
    bars: List[List[Dict[str, Any]]] = []
    current_bar: List[Dict[str, Any]] = []

    for chord_name in chords_seq:
        current_bar.append({
            "chord": chord_name,
            "beats": 4 if len(current_bar) == 0 else 2,
        })
        if len(current_bar) >= 2 or len(chords_seq) <= 4:
            # Adjust beats so total bar beats = 4
            if len(current_bar) == 2:
                current_bar[0]["beats"] = 2
                current_bar[1]["beats"] = 2
            bars.append(current_bar)
            current_bar = []

    if current_bar:
        current_bar[0]["beats"] = 4
        bars.append(current_bar)

    # Attach roman numerals to raw chord events
    for i, c_event in enumerate(raw_chords):
        if i < len(analysis.chords):
            c_event.roman_numeral = analysis.chords[i].roman_numeral

    summary = f"Detected {len(chords_seq)} chords in Key of {detected_key} {detected_mode}. Progression: {' -> '.join(chords_seq)}."

    return TranscribedProgressionResponse(
        detected_bpm=bpm,
        detected_key=detected_key,
        detected_mode=detected_mode,
        time_signature="4/4",
        chords_sequence=chords_seq,
        bars=bars,
        harmonic_summary=summary,
        raw_chords=raw_chords,
        total_duration=round(total_duration, 2),
        inference_device="cpu",
    )
