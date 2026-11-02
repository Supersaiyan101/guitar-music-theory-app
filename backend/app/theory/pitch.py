"""Pitch Class Algebra and Enharmonic Resolution for Guitar Theory Kingdom.

Supports two notation modes:
- NotationMode.PRACTICAL (Default): Tailored for guitar fretboards. Never shows E#, B#, Cb, Fb,
  or double-sharps. F# Major ends on F.
- NotationMode.ACADEMIC: Strict classical diatonic rule where every 7-note scale must have
  each letter (A through G) appear exactly once (e.g. F# Major ends on E#).

Includes voice-leading minimal distance, enharmonic comparison, Circle of Fifths,
and key signature accidentals tracking.
"""
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple


class NotationMode(str, Enum):
    PRACTICAL = "practical"  # Guitar-friendly (E# -> F, B# -> C, Cb -> B, Fb -> E)
    ACADEMIC = "academic"    # Classical diatonic (preserves strict A-G letter sequences)


# Canonical 12 chromatic semitones (0 to 11 starting at C)
PITCH_CLASS_TO_SHARP: Tuple[str, ...] = (
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
)

PITCH_CLASS_TO_FLAT: Tuple[str, ...] = (
    "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"
)

# Base diatonic letters
DIATONIC_LETTERS: Tuple[str, ...] = ("C", "D", "E", "F", "G", "A", "B")
LETTER_INDEX: Dict[str, int] = {letter: idx for idx, letter in enumerate(DIATONIC_LETTERS)}
LETTER_NATURAL_PITCH_CLASS: Dict[str, int] = {
    "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11
}

# Standard note name to pitch class (supports naturals, sharps, flats, double accidentals)
NOTE_NAME_TO_PITCH_CLASS: Dict[str, int] = {
    "C": 0, "B#": 0, "Dbb": 0,
    "C#": 1, "Db": 1, "Bx": 1,
    "D": 2, "C##": 2, "Cx": 2, "Ebb": 2,
    "D#": 3, "Eb": 3, "Fbb": 3,
    "E": 4, "Dx": 4, "D##": 4, "Fb": 4,
    "F": 5, "E#": 5, "Gbb": 5,
    "F#": 6, "Gb": 6, "Ex": 6, "E##": 6,
    "G": 7, "Fx": 7, "F##": 7, "Abb": 7,
    "G#": 8, "Ab": 8,
    "A": 9, "Gx": 9, "G##": 9, "Bbb": 9,
    "A#": 10, "Bb": 10, "Cbb": 10,
    "B": 11, "Ax": 11, "A##": 11, "Cb": 11,
}

# Practical simplifications for guitarists
PRACTICAL_MAP: Dict[str, str] = {
    "E#": "F",
    "B#": "C",
    "Cb": "B",
    "Fb": "E",
    "Fx": "G",
    "F##": "G",
    "Cx": "D",
    "C##": "D",
    "Gx": "A",
    "G##": "A",
    "Dx": "E",
    "D##": "E",
    "Ax": "B",
    "A##": "B",
    "Bbb": "A",
    "Ebb": "D",
    "Abb": "G",
    "Dbb": "C",
    "Gbb": "F",
    "Cbb": "Bb",
}

# Keys that traditionally prefer flats
FLAT_ROOTS = {"F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm"}

# The Circle of Fifths (Clockwise: C -> G -> D -> A -> E -> B -> F#/Gb -> Db -> Ab -> Eb -> Bb -> F)
CIRCLE_OF_FIFTHS: Tuple[str, ...] = (
    "C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"
)

# Standard order of sharps and flats in key signatures
ORDER_OF_SHARPS: Tuple[str, ...] = ("F#", "C#", "G#", "D#", "A#", "E#", "B#")
ORDER_OF_FLATS: Tuple[str, ...] = ("Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb")

# Key signature accidental counts for major keys
KEY_ACCIDENTALS_MAP: Dict[str, Tuple[int, str]] = {
    "C": (0, "natural"),
    "G": (1, "sharp"),
    "D": (2, "sharp"),
    "A": (3, "sharp"),
    "E": (4, "sharp"),
    "B": (5, "sharp"),
    "F#": (6, "sharp"),
    "C#": (7, "sharp"),
    "F": (1, "flat"),
    "Bb": (2, "flat"),
    "Eb": (3, "flat"),
    "Ab": (4, "flat"),
    "Db": (5, "flat"),
    "Gb": (6, "flat"),
    "Cb": (7, "flat"),
}


def normalize_note_name(note: str) -> str:
    """Normalizes note string to proper capitalization and stripped whitespace.
    
    Examples:
        'c#'   -> 'C#'
        'bb'   -> 'Bb'
        '  f# ' -> 'F#'
        'g##'  -> 'G##'
    """
    clean = note.strip()
    if not clean:
        raise ValueError("Empty note string")
    
    letter = clean[0].upper()
    accidental = clean[1:]
    
    norm_accidental = ""
    for ch in accidental:
        if ch in ("B", "b"):
            norm_accidental += "b"
        elif ch == "#":
            norm_accidental += "#"
        elif ch in ("X", "x"):
            norm_accidental += "x"
        else:
            norm_accidental += ch
            
    return f"{letter}{norm_accidental}"


def note_to_pitch_class(note: str) -> int:
    """Returns the pitch class (0-11) for any valid note name.
    Case-insensitive (handles 'c#', 'bb', etc.).
    
    Raises:
        ValueError: If note is not recognized.
    """
    normalized = normalize_note_name(note)
    if normalized in NOTE_NAME_TO_PITCH_CLASS:
        return NOTE_NAME_TO_PITCH_CLASS[normalized]
    raise ValueError(f"Unknown note name: '{note}'")


def pitch_class_to_note(pc: int, prefer_flats: bool = False) -> str:
    """Returns the canonical note name for a pitch class (0-11)."""
    norm_pc = pc % 12
    return PITCH_CLASS_TO_FLAT[norm_pc] if prefer_flats else PITCH_CLASS_TO_SHARP[norm_pc]


def are_enharmonic(note_a: str, note_b: str) -> bool:
    """Returns True if note_a and note_b vibrate at the exact same physical pitch class.
    
    Examples:
        are_enharmonic("C#", "Db")  -> True
        are_enharmonic("E#", "F")   -> True
        are_enharmonic("B#", "C")   -> True
        are_enharmonic("C", "D")    -> False
    """
    return note_to_pitch_class(note_a) == note_to_pitch_class(note_b)


def semitones_between(from_note: str, to_note: str) -> int:
    """Calculates ascending semitone interval from from_note to to_note (0-11)."""
    pc_from = note_to_pitch_class(from_note)
    pc_to = note_to_pitch_class(to_note)
    return (pc_to - pc_from) % 12


def shortest_semitone_distance(from_note: str, to_note: str) -> int:
    """Calculates the minimal fret/voice-leading distance between two notes (-6 to +6).
    
    Positive indicates shortest path is ascending (up frets).
    Negative indicates shortest path is descending (down frets).
    
    Examples:
        shortest_semitone_distance("C", "B") -> -1 (B is 1 fret down from C)
        shortest_semitone_distance("B", "C") -> +1 (C is 1 fret up from B)
        shortest_semitone_distance("A", "C") -> +3 (C is 3 frets up from A)
        shortest_semitone_distance("E", "D") -> -2 (D is 2 frets down from E)
    """
    asc = semitones_between(from_note, to_note)
    if asc > 6:
        return asc - 12
    return asc


def parse_note(note: str) -> Tuple[str, str]:
    """Splits a note into (base_letter, accidental).
    Case-insensitive.
    Example: 'c#' -> ('C', '#'), 'bb' -> ('B', 'b'), 'D' -> ('D', '')
    """
    normalized = normalize_note_name(note)
    letter = normalized[0]
    if letter not in DIATONIC_LETTERS:
        raise ValueError(f"Invalid note letter '{letter}' in '{note}'")
    accidental = normalized[1:]
    return letter, accidental


def simplify_to_practical(note: str) -> str:
    """Simplifies awkward classical enharmonics to physical guitar frets (e.g. E# -> F)."""
    normalized = normalize_note_name(note)
    return PRACTICAL_MAP.get(normalized, normalized)


def spell_note_with_letter(
    target_pc: int,
    target_letter: str,
    mode: NotationMode = NotationMode.PRACTICAL
) -> str:
    """Spells a target pitch class using a specific diatonic letter.
    
    If mode is PRACTICAL, converts awkward enharmonics (like E# or B#) to F, C, etc.
    """
    target_letter = target_letter.upper()
    if target_letter not in LETTER_NATURAL_PITCH_CLASS:
        raise ValueError(f"Invalid diatonic letter: '{target_letter}'")
    
    natural_pc = LETTER_NATURAL_PITCH_CLASS[target_letter]
    diff = (target_pc - natural_pc) % 12
    if diff > 6:
        diff -= 12
        
    if diff == 0:
        spelled = target_letter
    elif diff == 1:
        spelled = f"{target_letter}#"
    elif diff == 2:
        spelled = f"{target_letter}##"
    elif diff == -1:
        spelled = f"{target_letter}b"
    elif diff == -2:
        spelled = f"{target_letter}bb"
    else:
        spelled = pitch_class_to_note(target_pc)

    if mode == NotationMode.PRACTICAL:
        return simplify_to_practical(spelled)
    return spelled


def spell_diatonic_scale(
    root_note: str,
    semitone_offsets: List[int],
    mode: NotationMode = NotationMode.PRACTICAL
) -> List[str]:
    """Generates proper musical spellings for a 7-note diatonic scale or mode.
    
    - In ACADEMIC mode: Every letter (A-G) appears exactly once in sequence.
    - In PRACTICAL mode (Default): Replaces academic artifacts (E#, B#, Cb, Fb) with their
      physical guitar fret equivalents (F, C, B, E).
    """
    normalized_root = normalize_note_name(root_note)
    root_letter, _ = parse_note(normalized_root)
    root_pc = note_to_pitch_class(normalized_root)
    start_letter_idx = LETTER_INDEX[root_letter]
    
    if len(semitone_offsets) == 7:
        spelled_notes: List[str] = []
        for i, offset in enumerate(semitone_offsets):
            current_letter = DIATONIC_LETTERS[(start_letter_idx + i) % 7]
            target_pc = (root_pc + offset) % 12
            note = spell_note_with_letter(target_pc, current_letter, mode=mode)
            spelled_notes.append(note)
        return spelled_notes
    else:
        prefer_flats = (normalized_root in FLAT_ROOTS) or ("b" in normalized_root)
        notes = [pitch_class_to_note((root_pc + offset) % 12, prefer_flats=prefer_flats) for offset in semitone_offsets]
        if mode == NotationMode.PRACTICAL:
            return [simplify_to_practical(n) for n in notes]
        return notes


def transpose_note(note: str, semitones: int, prefer_flats: Optional[bool] = None) -> str:
    """Transposes a note by semitones delta (supports positive and negative semitones).
    
    Examples:
        transpose_note("C", 2)   -> "D"  (up 2 frets)
        transpose_note("C", -1)  -> "B"  (down 1 fret)
        transpose_note("E", -2)  -> "D"  (down 2 frets)
    """
    normalized = normalize_note_name(note)
    pc = note_to_pitch_class(normalized)
    new_pc = (pc + semitones) % 12
    if prefer_flats is None:
        prefer_flats = (normalized in FLAT_ROOTS) or ("b" in normalized)
    return pitch_class_to_note(new_pc, prefer_flats=prefer_flats)


def get_circle_of_fifths() -> List[str]:
    """Returns the 12 keys in clockwise order around the Circle of Fifths.
    Starting at C (12 o'clock).
    """
    return list(CIRCLE_OF_FIFTHS)


def get_key_neighbors(key: str) -> Dict[str, str]:
    """Returns the I (Tonic), IV (Subdominant, 1 step counter-clockwise),
    and V (Dominant, 1 step clockwise) neighbor chords for any key on the Circle of Fifths.
    
    Example:
        get_key_neighbors("C") -> {'I': 'C', 'IV': 'F', 'V': 'G'}
        get_key_neighbors("G") -> {'I': 'G', 'IV': 'C', 'V': 'D'}
        get_key_neighbors("E") -> {'I': 'E', 'IV': 'A', 'V': 'B'}
    """
    normalized = normalize_note_name(key)
    norm_lookup = normalized
    if norm_lookup == "Gb":
        norm_lookup = "F#"
        
    if norm_lookup not in CIRCLE_OF_FIFTHS:
        target_pc = note_to_pitch_class(normalized)
        norm_lookup = [k for k in CIRCLE_OF_FIFTHS if note_to_pitch_class(k) == target_pc][0]
        
    idx = CIRCLE_OF_FIFTHS.index(norm_lookup)
    iv_idx = (idx - 1) % 12
    v_idx = (idx + 1) % 12
    
    return {
        "I": CIRCLE_OF_FIFTHS[idx],
        "IV": CIRCLE_OF_FIFTHS[iv_idx],
        "V": CIRCLE_OF_FIFTHS[v_idx],
    }


def get_key_accidentals(key: str) -> Dict[str, Any]:
    """Returns the key signature details: count, type ('sharp', 'flat', 'natural'),
    and the ordered list of altered notes.
    
    Examples:
        get_key_accidentals("C") -> {'count': 0, 'type': 'natural', 'accidentals': []}
        get_key_accidentals("D") -> {'count': 2, 'type': 'sharp', 'accidentals': ['F#', 'C#']}
        get_key_accidentals("Eb") -> {'count': 3, 'type': 'flat', 'accidentals': ['Bb', 'Eb', 'Ab']}
    """
    normalized = normalize_note_name(key)
    if normalized not in KEY_ACCIDENTALS_MAP:
        raise ValueError(f"Unknown key signature '{key}'")
        
    count, acc_type = KEY_ACCIDENTALS_MAP[normalized]
    if acc_type == "sharp":
        accidentals_list = list(ORDER_OF_SHARPS[:count])
    elif acc_type == "flat":
        accidentals_list = list(ORDER_OF_FLATS[:count])
    else:
        accidentals_list = []
        
    return {
        "key": normalized,
        "count": count,
        "type": acc_type,
        "accidentals": accidentals_list,
    }
