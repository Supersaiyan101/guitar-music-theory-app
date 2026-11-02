"""Pitch Class Algebra and Enharmonic Resolution for Guitar Theory Kingdom.

Supports two notation modes:
- NotationMode.PRACTICAL (Default): Tailored for guitar fretboards. Never shows E#, B#, Cb, Fb,
  or double-sharps. F# Major ends on F.
- NotationMode.ACADEMIC: Strict classical diatonic rule where every 7-note scale must have
  each letter (A through G) appear exactly once (e.g. F# Major ends on E#).
"""
from enum import Enum
from typing import Dict, List, Optional, Tuple


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


def note_to_pitch_class(note: str) -> int:
    """Returns the pitch class (0-11) for any valid note name.
    
    Raises:
        ValueError: If note is not recognized.
    """
    clean_note = note.strip()
    if clean_note in NOTE_NAME_TO_PITCH_CLASS:
        return NOTE_NAME_TO_PITCH_CLASS[clean_note]
    raise ValueError(f"Unknown note name: '{note}'")


def pitch_class_to_note(pc: int, prefer_flats: bool = False) -> str:
    """Returns the canonical note name for a pitch class (0-11)."""
    norm_pc = pc % 12
    return PITCH_CLASS_TO_FLAT[norm_pc] if prefer_flats else PITCH_CLASS_TO_SHARP[norm_pc]


def semitones_between(from_note: str, to_note: str) -> int:
    """Calculates ascending semitone interval from from_note to to_note (0-11)."""
    pc_from = note_to_pitch_class(from_note)
    pc_to = note_to_pitch_class(to_note)
    return (pc_to - pc_from) % 12


def parse_note(note: str) -> Tuple[str, str]:
    """Splits a note into (base_letter, accidental).
    Example: 'C#' -> ('C', '#'), 'Bb' -> ('B', 'b'), 'D' -> ('D', '')
    """
    clean = note.strip()
    if not clean:
        raise ValueError("Empty note string")
    letter = clean[0].upper()
    if letter not in DIATONIC_LETTERS:
        raise ValueError(f"Invalid note letter '{letter}' in '{note}'")
    accidental = clean[1:]
    return letter, accidental


def simplify_to_practical(note: str) -> str:
    """Simplifies awkward classical enharmonics to physical guitar frets (e.g. E# -> F)."""
    clean = note.strip()
    return PRACTICAL_MAP.get(clean, clean)


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
    root_letter, _ = parse_note(root_note)
    root_pc = note_to_pitch_class(root_note)
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
        # For non-7-note scales (pentatonic, blues, etc.)
        prefer_flats = (root_note in FLAT_ROOTS) or ("b" in root_note)
        notes = [pitch_class_to_note((root_pc + offset) % 12, prefer_flats=prefer_flats) for offset in semitone_offsets]
        if mode == NotationMode.PRACTICAL:
            return [simplify_to_practical(n) for n in notes]
        return notes


def transpose_note(note: str, semitones: int, prefer_flats: Optional[bool] = None) -> str:
    """Transposes a note by semitones delta."""
    pc = note_to_pitch_class(note)
    new_pc = (pc + semitones) % 12
    if prefer_flats is None:
        prefer_flats = (note in FLAT_ROOTS) or ("b" in note)
    return pitch_class_to_note(new_pc, prefer_flats=prefer_flats)
