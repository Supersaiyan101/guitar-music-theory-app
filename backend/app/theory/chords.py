"""Chord Formula and Quality Parser for Guitar Theory Kingdom.

Deconstructs any chord symbol (triads, 7ths, Hendrix chords, altered dominants,
slash chords) into root, intervals, and constituent spelled chord tones.
Supports triad inversions, sequential arpeggios, and Hendrix/Mayer chord embellishments.
"""
from typing import Any, Dict, List, Optional, Tuple
from backend.app.schemas.theory import ChordDefinition, ChordQuality
from backend.app.theory.pitch import (
    NotationMode,
    note_to_pitch_class,
    simplify_to_practical,
)
from backend.app.theory.intervals import get_note_at_interval


class ChordFormulaTemplate:
    """Template describing intervals, default quality enum, and description."""
    def __init__(
        self,
        name: str,
        quality: ChordQuality,
        intervals: List[str],
        description: str = "",
    ):
        self.name = name
        self.quality = quality
        self.intervals = intervals
        self.description = description


# Master dictionary of supported guitar chords and their interval formulas
CHORD_TEMPLATES: Dict[str, ChordFormulaTemplate] = {
    # Basic Triads & Power
    "maj": ChordFormulaTemplate(
        name="Major Triad",
        quality=ChordQuality.MAJOR,
        intervals=["1", "3", "5"],
        description="The fundamental happy, bright, stable major triad (Root, Major 3rd, 5th)."
    ),
    "min": ChordFormulaTemplate(
        name="Minor Triad",
        quality=ChordQuality.MINOR,
        intervals=["1", "b3", "5"],
        description="Sad, moody, emotional minor triad (Root, Minor 3rd, 5th)."
    ),
    "dim": ChordFormulaTemplate(
        name="Diminished Triad",
        quality=ChordQuality.HALF_DIMINISHED,
        intervals=["1", "b3", "b5"],
        description="Tense, unstable triad with flat 3rd and flat 5th."
    ),
    "aug": ChordFormulaTemplate(
        name="Augmented Triad",
        quality=ChordQuality.MAJOR,
        intervals=["1", "3", "#5"],
        description="Dreamy, suspenseful triad with a sharp 5th."
    ),
    "5": ChordFormulaTemplate(
        name="Power Chord (5th)",
        quality=ChordQuality.POWER_CHORD,
        intervals=["1", "5"],
        description="The backbone of rock and metal. Heavy, neutral, no 3rd."
    ),

    # Suspended Chords
    "sus2": ChordFormulaTemplate(
        name="Suspended 2nd",
        quality=ChordQuality.SUSPENDED_2,
        intervals=["1", "2", "5"],
        description="Open, unresolved, floating sound with 2nd replacing 3rd."
    ),
    "sus4": ChordFormulaTemplate(
        name="Suspended 4th",
        quality=ChordQuality.SUSPENDED_4,
        intervals=["1", "4", "5"],
        description="Classic tension chord resolving to major triad (e.g. Pinball Wizard)."
    ),
    "7sus4": ChordFormulaTemplate(
        name="7th Suspended 4th",
        quality=ChordQuality.DOMINANT_SEVENTH,
        intervals=["1", "4", "5", "b7"],
        description="Dominant 7th with suspended 4th. Very common in funk and fusion."
    ),

    # Add Chords
    "add9": ChordFormulaTemplate(
        name="Add 9",
        quality=ChordQuality.MAJOR,
        intervals=["1", "3", "5", "9"],
        description="Lush, contemporary acoustic sound (Major triad + 9th, no 7th)."
    ),
    "madd9": ChordFormulaTemplate(
        name="Minor Add 9",
        quality=ChordQuality.MINOR,
        intervals=["1", "b3", "5", "9"],
        description="Haunting, beautiful minor color."
    ),
    "add11": ChordFormulaTemplate(
        name="Add 11",
        quality=ChordQuality.MAJOR,
        intervals=["1", "3", "5", "11"],
        description="Triad with 11th added on top."
    ),

    # 6th Chords
    "6": ChordFormulaTemplate(
        name="Major 6th",
        quality=ChordQuality.MAJOR,
        intervals=["1", "3", "5", "6"],
        description="Sweet, vintage swing and country sound."
    ),
    "m6": ChordFormulaTemplate(
        name="Minor 6th",
        quality=ChordQuality.MINOR,
        intervals=["1", "b3", "5", "6"],
        description="Dorian color chord, jazzy and introspective."
    ),
    "6/9": ChordFormulaTemplate(
        name="6/9 Chord",
        quality=ChordQuality.MAJOR,
        intervals=["1", "3", "5", "6", "9"],
        description="Pentatonic chord voicing. Bossa nova, Hendrix ballad ending chord."
    ),

    # 7th Chords
    "7": ChordFormulaTemplate(
        name="Dominant 7th",
        quality=ChordQuality.DOMINANT_SEVENTH,
        intervals=["1", "3", "5", "b7"],
        description="The heart of blues and rock n roll (Major triad with minor 7th)."
    ),
    "maj7": ChordFormulaTemplate(
        name="Major 7th",
        quality=ChordQuality.MAJOR_SEVENTH,
        intervals=["1", "3", "5", "7"],
        description="Dreamy, nostalgic, sophisticated jazz/R&B/pop sound."
    ),
    "m7": ChordFormulaTemplate(
        name="Minor 7th",
        quality=ChordQuality.MINOR_SEVENTH,
        intervals=["1", "b3", "5", "b7"],
        description="Mellow, soulful, foundational to funk, jazz, and minor blues."
    ),
    "m(maj7)": ChordFormulaTemplate(
        name="Minor-Major 7th",
        quality=ChordQuality.MINOR,
        intervals=["1", "b3", "5", "7"],
        description="The spy movie / James Bond chord. Minor triad with major 7th."
    ),
    "m7b5": ChordFormulaTemplate(
        name="Half-Diminished (m7b5)",
        quality=ChordQuality.HALF_DIMINISHED,
        intervals=["1", "b3", "b5", "b7"],
        description="The ii chord in minor key ii-V-i progressions."
    ),
    "dim7": ChordFormulaTemplate(
        name="Diminished 7th",
        quality=ChordQuality.DIMINISHED_SEVENTH,
        intervals=["1", "b3", "b5", "bb7"],
        description="Symmetric tension chord built of stacked minor 3rds."
    ),

    # Altered & Hendrix Chords
    "7#9": ChordFormulaTemplate(
        name="7 Sharp 9 (Hendrix Chord)",
        quality=ChordQuality.ALTERED_DOMINANT,
        intervals=["1", "3", "5", "b7", "#9"],
        description="The iconic Purple Haze chord. Has both major 3rd and sharp 9 (sounds like minor 3rd)."
    ),
    "7b9": ChordFormulaTemplate(
        name="7 Flat 9",
        quality=ChordQuality.ALTERED_DOMINANT,
        intervals=["1", "3", "5", "b7", "b9"],
        description="Flamenco and jazz altered dominant with dark tension."
    ),
    "7#5": ChordFormulaTemplate(
        name="7 Sharp 5 (Augmented 7)",
        quality=ChordQuality.ALTERED_DOMINANT,
        intervals=["1", "3", "#5", "b7"],
        description="Dominant chord with augmented 5th leading strongly to tonic."
    ),
    "7b5": ChordFormulaTemplate(
        name="7 Flat 5",
        quality=ChordQuality.ALTERED_DOMINANT,
        intervals=["1", "3", "b5", "b7"],
        description="Whole-tone dominant flavor with tritone."
    ),
    "7alt": ChordFormulaTemplate(
        name="Altered Dominant",
        quality=ChordQuality.ALTERED_DOMINANT,
        intervals=["1", "3", "b5", "b7", "#9"],
        description="Full altered jazz chord resolving to minor or major tonic."
    ),

    # 9th, 11th, and 13th Extensions
    "9": ChordFormulaTemplate(
        name="Dominant 9th",
        quality=ChordQuality.DOMINANT_SEVENTH,
        intervals=["1", "3", "5", "b7", "9"],
        description="Funk, T-Bone Walker blues, and classic R&B groove chord."
    ),
    "maj9": ChordFormulaTemplate(
        name="Major 9th",
        quality=ChordQuality.MAJOR_SEVENTH,
        intervals=["1", "3", "5", "7", "9"],
        description="Lush, spacious modern jazz and neo-soul voicing."
    ),
    "m9": ChordFormulaTemplate(
        name="Minor 9th",
        quality=ChordQuality.MINOR_SEVENTH,
        intervals=["1", "b3", "5", "b7", "9"],
        description="Ultra-smooth minor chord. Steely Dan and Pink Floyd staple."
    ),
    "11": ChordFormulaTemplate(
        name="11th Chord",
        quality=ChordQuality.DOMINANT_SEVENTH,
        intervals=["1", "5", "b7", "9", "11"],
        description="Modern gospel and funk dominant chord."
    ),
    "m11": ChordFormulaTemplate(
        name="Minor 11th",
        quality=ChordQuality.MINOR_SEVENTH,
        intervals=["1", "b3", "5", "b7", "9", "11"],
        description="Spacious, impressionistic modern minor voicing."
    ),
    "13": ChordFormulaTemplate(
        name="Dominant 13th",
        quality=ChordQuality.DOMINANT_SEVENTH,
        intervals=["1", "3", "5", "b7", "9", "13"],
        description="The ultimate big-band and funk dominant chord."
    ),
    "maj13": ChordFormulaTemplate(
        name="Major 13th",
        quality=ChordQuality.MAJOR_SEVENTH,
        intervals=["1", "3", "5", "7", "9", "13"],
        description="Full-spectrum lush major voicing."
    ),
}

# Suffix aliases mapping to canonical template key
SUFFIX_ALIASES: Dict[str, str] = {
    "": "maj",
    "m": "min",
    "-": "min",
    "minor": "min",
    "+": "aug",
    "augmented": "aug",
    "o": "dim",
    "diminished": "dim",
    "M7": "maj7",
    "Δ7": "maj7",
    "major7": "maj7",
    "min7": "m7",
    "-7": "m7",
    "minor7": "m7",
    "ø": "m7b5",
    "ø7": "m7b5",
    "half-dim": "m7b5",
    "o7": "dim7",
    "dom7": "7",
    "dominant7": "7",
    "hendrix": "7#9",
}


def parse_chord_symbol(symbol: str) -> Tuple[str, str, Optional[str]]:
    """Parses a chord symbol string into (root, suffix/quality, bass).
    
    Examples:
        'C'       -> ('C', 'maj', None)
        'Am'      -> ('A', 'min', None)
        'G7#9'    -> ('G', '7#9', None)
        'D/F#'    -> ('D', 'maj', 'F#')
        'Am7/G'   -> ('A', 'm7', 'G')
        'Bbmaj7'  -> ('Bb', 'maj7', None)
    """
    clean = symbol.strip()
    if not clean:
        raise ValueError("Empty chord symbol")
    
    # 1. Check for slash chord (bass inversion)
    bass = None
    if "/" in clean:
        parts = clean.split("/", 1)
        clean = parts[0].strip()
        bass = parts[1].strip().capitalize()
        _ = note_to_pitch_class(bass)
    
    # 2. Extract root note
    if len(clean) >= 2 and clean[1] in ("#", "b"):
        root = clean[:2].capitalize()
        suffix = clean[2:]
    else:
        root = clean[:1].capitalize()
        suffix = clean[1:]
        
    _ = note_to_pitch_class(root)
    
    # 3. Normalize suffix
    norm_suffix = SUFFIX_ALIASES.get(suffix, suffix.lower())
    if norm_suffix not in CHORD_TEMPLATES:
        if suffix in CHORD_TEMPLATES:
            norm_suffix = suffix
        else:
            supported = ", ".join(sorted(list(CHORD_TEMPLATES.keys())))
            raise ValueError(f"Unknown chord quality '{suffix}' in '{symbol}'. Supported: {supported}")
            
    return root, norm_suffix, bass


def deconstruct_chord(
    symbol: str,
    mode: NotationMode = NotationMode.PRACTICAL
) -> ChordDefinition:
    """Deconstructs any chord into its constituent tones, intervals, quality, and bass."""
    root, suffix, bass = parse_chord_symbol(symbol)
    tmpl = CHORD_TEMPLATES[suffix]
    
    tones = [get_note_at_interval(root, interval, mode=mode) for interval in tmpl.intervals]
    
    return ChordDefinition(
        symbol=symbol,
        root=root,
        quality=tmpl.quality,
        intervals=tmpl.intervals,
        tones=tones,
        bass=bass,
    )


def get_chord_arpeggio(
    symbol: str,
    include_octave: bool = True,
    mode: NotationMode = NotationMode.PRACTICAL
) -> List[str]:
    """Generates sequential arpeggio note lines for soloing over chord changes.
    
    Example:
        get_chord_arpeggio("Am7") -> ['A', 'C', 'E', 'G', 'A']
        get_chord_arpeggio("G")   -> ['G', 'B', 'D', 'G']
    """
    chord = deconstruct_chord(symbol, mode=mode)
    notes = list(chord.tones)
    if include_octave and chord.root not in notes[-1:]:
        notes.append(chord.root)
    return notes


def get_chord_embellishments(
    symbol: str,
    mode: NotationMode = NotationMode.PRACTICAL
) -> Dict[str, Any]:
    """Calculates the classic Hendrix / Mayer chord embellishment target notes
    (the hammer-on / pull-off color tones right inside the chord grip).
    
    Identifies:
        - Sus4 embellishment (hammering from 3rd to 4th)
        - Add9 / Sus2 embellishment (hammering from Root to 2nd/9th)
        - 6th embellishment (hammering from 5th to 6th)
    
    Example:
        get_chord_embellishments("C") ->
            sus4: F (hammer on from E)
            add9: D (hammer on from C)
            six:  A (hammer on from G)
    """
    chord = deconstruct_chord(symbol, mode=mode)
    root = chord.root
    
    # Calculate embellishment notes
    sus4_note = get_note_at_interval(root, "4", mode=mode)
    add9_note = get_note_at_interval(root, "2", mode=mode)
    six_note = get_note_at_interval(root, "6", mode=mode)
    
    return {
        "chord": chord.symbol,
        "root": root,
        "embellishments": {
            "sus4": {
                "interval": "4",
                "note": sus4_note,
                "action": "Hammer-on from 3rd to 4th (Classic Hendrix Little Wing suspended fill)",
            },
            "add9": {
                "interval": "9",
                "note": add9_note,
                "action": "Hammer-on from Root to 9th (Dreamy acoustic/ballad color)",
            },
            "sixth": {
                "interval": "6",
                "note": six_note,
                "action": "Hammer-on from 5th to 6th (Curtis Mayfield / R&B soul fill)",
            },
        }
    }


def get_triad_inversion_notes(
    root: str,
    quality: str = "maj",
    inversion: int = 0,
    mode: NotationMode = NotationMode.PRACTICAL
) -> List[str]:
    """Generates the notes of a triad for a specific inversion.
    
    Inversions:
        0 (Root Position): 1 - 3 - 5 (e.g. for G: G, B, D)
        1 (1st Inversion): 3 - 5 - 1 (e.g. for G/B: B, D, G)
        2 (2nd Inversion): 5 - 1 - 3 (e.g. for G/D: D, G, B)
    """
    chord = deconstruct_chord(f"{root}{quality if quality != 'maj' else ''}", mode=mode)
    if len(chord.tones) < 3:
        raise ValueError(f"Chord {chord.symbol} has fewer than 3 tones for triad inversion")
    
    triad_tones = chord.tones[:3]
    if inversion == 0:
        return triad_tones
    elif inversion == 1:
        return [triad_tones[1], triad_tones[2], triad_tones[0]]
    elif inversion == 2:
        return [triad_tones[2], triad_tones[0], triad_tones[1]]
    else:
        raise ValueError("Triad inversions can only be 0 (Root), 1 (1st), or 2 (2nd)")


def list_supported_chords() -> List[str]:
    """Returns list of all supported chord quality suffixes."""
    return sorted(list(CHORD_TEMPLATES.keys()))
