"""Interval Engine for Guitar Theory Kingdom.

Handles calculation of interval degrees, semitone distances, compound intervals
(9ths, 11ths, 13ths), interval inversions (Rule of 9), and double-stop (diad) classifications.
"""
from typing import Any, Dict, Optional, Tuple
from backend.app.theory.pitch import (
    DIATONIC_LETTERS,
    LETTER_INDEX,
    NotationMode,
    note_to_pitch_class,
    parse_note,
    semitones_between,
    simplify_to_practical,
    spell_note_with_letter,
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

# Diatonic letter offset for each degree (0 to 6)
DEGREE_TO_LETTER_OFFSET: Dict[str, int] = {
    "1": 0, "R": 0, "unison": 0, "8": 0, "octave": 0,
    "b2": 1, "m2": 1, "2": 1, "M2": 1, "#2": 1, "b9": 1, "9": 1, "#9": 1,
    "b3": 2, "m3": 2, "3": 2, "M3": 2,
    "4": 3, "P4": 3, "#4": 3, "11": 3, "#11": 3, "b11": 3,
    "b5": 4, "d5": 4, "5": 4, "P5": 4, "#5": 4,
    "b6": 5, "m6": 5, "6": 5, "M6": 5, "b13": 5, "13": 5,
    "bb7": 6, "dim7": 6, "b7": 6, "m7": 6, "7": 6, "M7": 6,
}

# Inversion of intervals (Rule of 9: 1 <-> 8, 2 <-> 7, 3 <-> 6, 4 <-> 5, etc.)
INTERVAL_INVERSIONS: Dict[str, str] = {
    "1": "8", "R": "8", "unison": "8",
    "b2": "7", "m2": "M7",
    "2": "b7", "M2": "m7",
    "b3": "6", "m3": "M6",  # Minor 3rd inverts to Major 6th!
    "3": "b6", "M3": "m6",  # Major 3rd inverts to Minor 6th!
    "4": "5", "P4": "P5",
    "b5": "b5", "#4": "#4", "TT": "TT",  # Tritone inverts to tritone
    "5": "4", "P5": "P4",
    "b6": "3", "m6": "M3",
    "6": "b3", "M6": "m3",
    "b7": "2", "m7": "M2",
    "7": "b2", "M7": "m2",
    "8": "1", "octave": "1",
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


def invert_interval(degree: str) -> str:
    """Returns the inverted interval following the classical and guitar Rule of 9.
    
    Examples:
        invert_interval("b3") -> "6"   (Minor 3rd becomes Major 6th - Hendrix 6th double-stop)
        invert_interval("3")  -> "b6"  (Major 3rd becomes Minor 6th)
        invert_interval("4")  -> "5"   (4th becomes 5th)
        invert_interval("5")  -> "4"   (5th becomes 4th)
        invert_interval("b7") -> "2"   (Minor 7th becomes Major 2nd)
        invert_interval("b5") -> "b5"  (Tritone symmetry)
    """
    clean = degree.strip()
    if clean in INTERVAL_INVERSIONS:
        return INTERVAL_INVERSIONS[clean]
    # Fallback via semitone inversion: (12 - st) % 12
    st = interval_to_semitones(clean) % 12
    inv_st = (12 - st) % 12
    return semitones_to_interval(inv_st)


def classify_diad(degree: str) -> Dict[str, Any]:
    """Classifies a double-stop / diad interval into its guitar playing context.
    
    Categories:
        - '3rd_harmony': Sweet vocal harmony (Allman Brothers, Chuck Berry)
        - '6th_sliding': Soul/gospel sliding double stops (Hendrix, Curtis Mayfield, Mayer)
        - '4th_stab': Hard rock & funk riff double-stops (Deep Purple, Prince)
        - '5th_power': Rock/metal power chord diad
        - 'octave': Wes Montgomery / Hendrix octave riffs
        - 'tritone': Gritty blues / dominant 7th tension
    """
    clean = degree.strip()
    st = interval_to_semitones(clean) % 12
    
    if st in (3, 4):
        return {
            "type": "3rd_harmony",
            "name": "3rd Double-Stop",
            "feel": "Sweet, vocal, classic rock/country harmony",
            "adjacent_strings": True,
        }
    elif st in (8, 9):
        return {
            "type": "6th_sliding",
            "name": "6th Double-Stop",
            "feel": "Soulful, singing gospel/R&B sliding harmony (Mayer/Hendrix)",
            "adjacent_strings": False,  # Typically played on strings 1 & 3 or 2 & 4 (skipped string)
        }
    elif st == 5:
        return {
            "type": "4th_stab",
            "name": "4th Double-Stop",
            "feel": "Heavy rock, punchy funk stabs (Smoke on the Water)",
            "adjacent_strings": True,
        }
    elif st == 7:
        return {
            "type": "5th_power",
            "name": "5th Power Diad",
            "feel": "Heavy, neutral, powerful rock foundation",
            "adjacent_strings": True,
        }
    elif st == 0:
        return {
            "type": "octave",
            "name": "Octave Diad",
            "feel": "Strong melodic weight, jazz (Wes Montgomery) & rock leads",
            "adjacent_strings": False,  # Skipped string
        }
    elif st == 6:
        return {
            "type": "tritone",
            "name": "Tritone Diad",
            "feel": "Unstable blues tension, drives dominant 7th chords",
            "adjacent_strings": True,
        }
    else:
        return {
            "type": "step_tension",
            "name": f"Interval {clean}",
            "feel": "Melodic passing step or tension",
            "adjacent_strings": True,
        }


def get_double_stop_notes(
    root_note: str,
    interval_degree: str,
    mode: NotationMode = NotationMode.PRACTICAL
) -> Tuple[str, str]:
    """Returns the two harmonized notes of a guitar double-stop.
    
    Example:
        get_double_stop_notes("A", "b3") -> ("A", "C")
        get_double_stop_notes("A", "6")  -> ("A", "F#")
        get_double_stop_notes("E", "5")  -> ("E", "B")
    """
    harmonized_note = get_note_at_interval(root_note, interval_degree, mode=mode)
    return (root_note, harmonized_note)


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
    """Finds the note that sits at a given interval from root_note with proper diatonic spelling.
    
    Example: root='A', interval='b3' -> 'C' (3rd degree of A has letter C)
             root='E', interval='b5' -> 'Bb' (5th degree of E has letter B, not A#!)
             root='F#', interval='7' (Major 7th) -> 'F' (in practical mode) or 'E#' (in academic)
    """
    clean_deg = interval_degree.strip()
    semitones = interval_to_semitones(clean_deg)
    root_pc = note_to_pitch_class(root_note)
    target_pc = (root_pc + semitones) % 12
    
    # Resolve target diatonic letter from degree number
    root_letter, _ = parse_note(root_note)
    start_letter_idx = LETTER_INDEX[root_letter]
    letter_offset = DEGREE_TO_LETTER_OFFSET.get(clean_deg, None)
    
    if letter_offset is not None:
        target_letter = DIATONIC_LETTERS[(start_letter_idx + letter_offset) % 7]
        return spell_note_with_letter(target_pc, target_letter, mode=mode)
    
    # Fallback to practical pitch class
    raw = transpose_note(root_note, semitones)
    if mode == NotationMode.PRACTICAL:
        return simplify_to_practical(raw)
    return raw


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
