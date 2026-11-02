"""Interval Engine for Guitar Theory Kingdom.

Handles calculation of interval degrees, semitone distances, compound intervals
(9ths, 11ths, 13ths), and note transpositions by interval.
"""
from typing import Dict, Optional
from backend.app.theory.pitch import (
    NotationMode,
    note_to_pitch_class,
    pitch_class_to_note,
    semitones_between,
    simplify_to_practical,
    transpose_note,
)

# Standard degree to semitone mapping (within an octave and compound)
DEGREE_TO_SEMITONES: Dict[str, int] = {
    # Simple intervals
    "1": 0, "R": 0, "unison": 0,
    "b2": 1, "m2": 1,
    "2": 2, "M2": 2,
    "#2": 3,
    "b3": 3, "m3": 3,
    "3": 4, "M3": 4,
    "4": 5, "P4": 5,
    "#4": 6, "b5": 6, "d5": 6, "TT": 6,
    "5": 7, "P5": 7,
    "#5": 8, "b6": 8, "m6": 8,
    "6": 9, "M6": 9,
    "bb7": 9, "dim7": 9,
    "b7": 10, "m7": 10,
    "7": 11, "M7": 11,
    "8": 12, "P8": 12, "octave": 12,
    # Compound extensions (guitar chords & tensions)
    "b9": 13,
    "9": 14,
    "#9": 15,  # Hendrix chord tension
    "b11": 16,
    "11": 17,
    "#11": 18, # Lydian dominant tension
    "b13": 20,
    "13": 21,  # Funk / R&B extension
}

# Canonical 12 chromatic semitones to guitar interval degree
SEMITONES_TO_DEGREE_FLAT: Dict[int, str] = {
    0: "1",
    1: "b2",
    2: "2",
    3: "b3",
    4: "3",
    5: "4",
    6: "b5",
    7: "5",
    8: "b6",
    9: "6",
    10: "b7",
    11: "7",
}

SEMITONES_TO_DEGREE_SHARP: Dict[int, str] = {
    0: "1",
    1: "#1",
    2: "2",
    3: "#2",
    4: "3",
    5: "4",
    6: "#4",
    7: "5",
    8: "#5",
    9: "6",
    10: "#6",
    11: "7",
}

INTERVAL_FULL_NAMES: Dict[str, str] = {
    "1": "Root (Unison)",
    "b2": "Minor 2nd",
    "2": "Major 2nd",
    "b3": "Minor 3rd",
    "3": "Major 3rd",
    "4": "Perfect 4th",
    "b5": "Diminished 5th / Tritone",
    "#4": "Augmented 4th / Tritone",
    "5": "Perfect 5th",
    "b6": "Minor 6th",
    "6": "Major 6th",
    "b7": "Minor 7th (Dominant)",
    "7": "Major 7th",
    "8": "Octave",
    "b9": "Flat 9th",
    "9": "9th",
    "#9": "Sharp 9th (Hendrix Note)",
    "11": "11th",
    "#11": "Sharp 11th",
    "b13": "Flat 13th",
    "13": "13th",
}


def interval_to_semitones(degree: str) -> int:
    """Converts an interval string (e.g. 'b3', '3', '#9', 'R') to semitones.
    
    Raises:
        ValueError: If interval is not recognized.
    """
    clean = degree.strip()
    if clean in DEGREE_TO_SEMITONES:
        return DEGREE_TO_SEMITONES[clean]
    raise ValueError(f"Unknown interval degree: '{degree}'")


def semitones_to_interval(semitones: int, prefer_flat: bool = True) -> str:
    """Converts a semitone count (0-11 or compound) to standard interval degree."""
    norm_st = semitones % 12
    mapping = SEMITONES_TO_DEGREE_FLAT if prefer_flat else SEMITONES_TO_DEGREE_SHARP
    return mapping[norm_st]


def get_interval_between(root_note: str, target_note: str, prefer_flat: bool = True) -> str:
    """Calculates the interval degree from root_note to target_note.
    
    Example: root='A', target='C' -> 'b3'
             root='A', target='C#' -> '3'
             root='A', target='G' -> 'b7'
             root='E', target='Bb' -> 'b5'
    """
    st = semitones_between(root_note, target_note)
    return semitones_to_interval(st, prefer_flat=prefer_flat)


def get_note_at_interval(
    root_note: str,
    interval_degree: str,
    mode: NotationMode = NotationMode.PRACTICAL
) -> str:
    """Finds the note that sits at a given interval from root_note.
    
    Example: root='A', interval='b3' -> 'C'
             root='A', interval='3' -> 'C#'
             root='F#', interval='7' (Major 7th) -> 'F' (in practical mode) or 'E#' (in academic)
    """
    semitones = interval_to_semitones(interval_degree)
    raw_note = transpose_note(root_note, semitones)
    if mode == NotationMode.PRACTICAL:
        return simplify_to_practical(raw_note)
    return raw_note


def get_interval_name(interval_degree: str) -> str:
    """Returns the descriptive human name for an interval degree (e.g. 'Minor 3rd')."""
    clean = interval_degree.strip()
    return INTERVAL_FULL_NAMES.get(clean, f"Interval {clean}")


def is_chord_tone(interval_degree: str) -> bool:
    """Returns True if the interval is an essential chord tone (Root, 3rd, 5th, or 7th)."""
    norm = interval_degree.strip()
    # Normalize compound extensions
    if norm in ("9", "b9", "#9"):
        norm = "2"
    elif norm in ("11", "#11"):
        norm = "4"
    elif norm in ("13", "b13"):
        norm = "6"
    return norm in ("1", "R", "b3", "3", "5", "b5", "#5", "b7", "7", "bb7")
