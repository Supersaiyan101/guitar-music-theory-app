"""Scale and Mode Generator for Guitar Theory Kingdom.

Supports full major and minor scales (Natural, Harmonic, Melodic),
pentatonics, blues scales, church modes, and exotic shred scales.
"""
from typing import Dict, List, Optional
from backend.app.schemas.theory import ScaleCategory, ScaleDefinition
from backend.app.theory.pitch import (
    NotationMode,
    note_to_pitch_class,
    spell_diatonic_scale,
    transpose_note,
)
from backend.app.theory.intervals import get_note_at_interval


class ScaleTemplate:
    """Internal definition of scale formulas and musical metadata."""
    def __init__(
        self,
        name: str,
        category: ScaleCategory,
        formula: List[int],
        intervals: List[str],
        character_notes: Optional[List[str]] = None,
        avoid_notes: Optional[List[str]] = None,
        description: str = "",
    ):
        self.name = name
        self.category = category
        self.formula = formula
        self.intervals = intervals
        self.character_notes = character_notes or []
        self.avoid_notes = avoid_notes or []
        self.description = description


# Master dictionary of supported guitar scales and modes
SCALE_TEMPLATES: Dict[str, ScaleTemplate] = {
    # Full Major Scales
    "major": ScaleTemplate(
        name="Major (Ionian)",
        category=ScaleCategory.MAJOR,
        formula=[0, 2, 4, 5, 7, 9, 11],
        intervals=["1", "2", "3", "4", "5", "6", "7"],
        character_notes=["7"],
        avoid_notes=["4"],
        description="The foundation of Western harmony. Bright, resolute, and uplifting."
    ),
    "ionian": ScaleTemplate(
        name="Ionian Mode",
        category=ScaleCategory.MODE,
        formula=[0, 2, 4, 5, 7, 9, 11],
        intervals=["1", "2", "3", "4", "5", "6", "7"],
        character_notes=["7"],
        avoid_notes=["4"],
        description="1st mode of the major scale. Natural major sound."
    ),

    # Full Minor Scales (All 3 Variants)
    "minor": ScaleTemplate(
        name="Natural Minor (Aeolian)",
        category=ScaleCategory.MINOR,
        formula=[0, 2, 3, 5, 7, 8, 10],
        intervals=["1", "2", "b3", "4", "5", "b6", "b7"],
        character_notes=["b6"],
        avoid_notes=["b6"],
        description="The standard natural minor scale. Melancholy, emotional, classic rock ballads."
    ),
    "natural_minor": ScaleTemplate(
        name="Natural Minor (Aeolian)",
        category=ScaleCategory.MINOR,
        formula=[0, 2, 3, 5, 7, 8, 10],
        intervals=["1", "2", "b3", "4", "5", "b6", "b7"],
        character_notes=["b6"],
        description="Natural minor scale (6th mode of Major)."
    ),
    "aeolian": ScaleTemplate(
        name="Aeolian Mode",
        category=ScaleCategory.MODE,
        formula=[0, 2, 3, 5, 7, 8, 10],
        intervals=["1", "2", "b3", "4", "5", "b6", "b7"],
        character_notes=["b6"],
        description="6th mode of the major scale."
    ),
    "harmonic_minor": ScaleTemplate(
        name="Harmonic Minor",
        category=ScaleCategory.MINOR,
        formula=[0, 2, 3, 5, 7, 8, 11],
        intervals=["1", "2", "b3", "4", "5", "b6", "7"],
        character_notes=["7", "b6"],
        description="Features a raised leading tone (Major 7th). Neo-classical, Spanish, Blackmore and Malmsteen sound."
    ),
    "melodic_minor": ScaleTemplate(
        name="Melodic Minor (Jazz Minor)",
        category=ScaleCategory.MINOR,
        formula=[0, 2, 3, 5, 7, 9, 11],
        intervals=["1", "2", "b3", "4", "5", "6", "7"],
        character_notes=["6", "7"],
        description="Ascending minor with natural 6 and 7. The bedrock of jazz and fusion soloing."
    ),

    # Pentatonics & Blues
    "minor_pentatonic": ScaleTemplate(
        name="Minor Pentatonic",
        category=ScaleCategory.PENTATONIC,
        formula=[0, 3, 5, 7, 10],
        intervals=["1", "b3", "4", "5", "b7"],
        character_notes=["b3", "b7"],
        description="The quintessential guitar scale. Foundation of rock, blues, and heavy metal soloing."
    ),
    "pentatonic": ScaleTemplate(
        name="Minor Pentatonic",
        category=ScaleCategory.PENTATONIC,
        formula=[0, 3, 5, 7, 10],
        intervals=["1", "b3", "4", "5", "b7"],
        character_notes=["b3", "b7"],
        description="Default pentatonic shorthand for Minor Pentatonic."
    ),
    "major_pentatonic": ScaleTemplate(
        name="Major Pentatonic",
        category=ScaleCategory.PENTATONIC,
        formula=[0, 2, 4, 7, 9],
        intervals=["1", "2", "3", "5", "6"],
        character_notes=["3", "6"],
        description="Sweet, soulful sound. B.B. King, Southern Rock, Dickey Betts, and Country leads."
    ),
    "blues": ScaleTemplate(
        name="Blues Scale",
        category=ScaleCategory.BLUES,
        formula=[0, 3, 5, 6, 7, 10],
        intervals=["1", "b3", "4", "b5", "5", "b7"],
        character_notes=["b5"],
        description="Minor pentatonic with the legendary flat-five (b5) 'blue note' passing tone."
    ),
    "major_blues": ScaleTemplate(
        name="Major Blues Scale",
        category=ScaleCategory.BLUES,
        formula=[0, 2, 3, 4, 7, 9],
        intervals=["1", "2", "b3", "3", "5", "6"],
        character_notes=["b3"],
        description="Major pentatonic with the flat-three blue note curl into the major 3rd."
    ),

    # The Remaining Church Modes
    "dorian": ScaleTemplate(
        name="Dorian Mode",
        category=ScaleCategory.MODE,
        formula=[0, 2, 3, 5, 7, 9, 10],
        intervals=["1", "2", "b3", "4", "5", "6", "b7"],
        character_notes=["6"],
        description="2nd mode. Minor with a hopeful, bright Natural 6th. Santana, Pink Floyd, Funk, and Miles Davis."
    ),
    "phrygian": ScaleTemplate(
        name="Phrygian Mode",
        category=ScaleCategory.MODE,
        formula=[0, 1, 3, 5, 7, 8, 10],
        intervals=["1", "b2", "b3", "4", "5", "b6", "b7"],
        character_notes=["b2"],
        description="3rd mode. Exotic, dark, Spanish flamenco and heavy metal sound driven by the flat 2nd."
    ),
    "lydian": ScaleTemplate(
        name="Lydian Mode",
        category=ScaleCategory.MODE,
        formula=[0, 2, 4, 6, 7, 9, 11],
        intervals=["1", "2", "3", "#4", "5", "6", "7"],
        character_notes=["#4"],
        description="4th mode. Ethereal, dreamy, futuristic sound with the raised 4th (#4). Steve Vai signature mode."
    ),
    "mixolydian": ScaleTemplate(
        name="Mixolydian Mode",
        category=ScaleCategory.MODE,
        formula=[0, 2, 4, 5, 7, 9, 10],
        intervals=["1", "2", "3", "4", "5", "6", "b7"],
        character_notes=["b7"],
        description="5th mode. Major sound with a dominant flat-7th. Classic rock, southern rock, and dominant 7th chords."
    ),
    "locrian": ScaleTemplate(
        name="Locrian Mode",
        category=ScaleCategory.MODE,
        formula=[0, 1, 3, 5, 6, 8, 10],
        intervals=["1", "b2", "b3", "4", "b5", "b6", "b7"],
        character_notes=["b2", "b5"],
        description="7th mode. Highly unstable, diminished sound with b2 and b5. Used over m7b5 chords."
    ),

    # Exotic / Metal Scales
    "phrygian_dominant": ScaleTemplate(
        name="Phrygian Dominant",
        category=ScaleCategory.ALTERED,
        formula=[0, 1, 4, 5, 7, 8, 10],
        intervals=["1", "b2", "3", "4", "5", "b6", "b7"],
        character_notes=["b2", "3"],
        description="5th mode of Harmonic Minor. The ultimate metal/Middle-Eastern/flamenco soloing scale."
    ),
}

# Aliases dictionary
ALIASES: Dict[str, str] = {
    "major_scale": "major",
    "ionian_mode": "ionian",
    "minor_scale": "minor",
    "aeolian_mode": "aeolian",
    "dorian_mode": "dorian",
    "phrygian_mode": "phrygian",
    "lydian_mode": "lydian",
    "mixolydian_mode": "mixolydian",
    "locrian_mode": "locrian",
    "jazz_minor": "melodic_minor",
    "minor_blues": "blues",
}


def normalize_scale_name(name: str) -> str:
    """Normalizes scale lookup name to template key."""
    key = name.strip().lower().replace("-", "_").replace(" ", "_")
    return ALIASES.get(key, key)


def get_scale(
    root: str,
    scale_type: str,
    mode: NotationMode = NotationMode.PRACTICAL
) -> ScaleDefinition:
    """Generates a complete ScaleDefinition for any root and scale type.
    
    Raises:
        ValueError: If scale_type is not recognized or root is invalid.
    """
    clean_root = root.strip().capitalize()
    # Validate root
    _ = note_to_pitch_class(clean_root)
    
    norm_type = normalize_scale_name(scale_type)
    if norm_type not in SCALE_TEMPLATES:
        available = ", ".join(sorted(SCALE_TEMPLATES.keys()))
        raise ValueError(f"Unknown scale type '{scale_type}'. Available scales: {available}")
    
    tmpl = SCALE_TEMPLATES[norm_type]
    
    # 7-note diatonic scales use strict letter distribution
    if len(tmpl.formula) == 7:
        spelled_notes = spell_diatonic_scale(clean_root, tmpl.formula, mode=mode)
    else:
        # Pentatonic, blues, and other scales generate notes from interval definitions
        spelled_notes = [get_note_at_interval(clean_root, interval, mode=mode) for interval in tmpl.intervals]
    
    scale_id = f"{clean_root.lower()}_{norm_type}"
    display_name = f"{clean_root} {tmpl.name}"
    
    return ScaleDefinition(
        id=scale_id,
        name=display_name,
        root=clean_root,
        scale_type=norm_type,
        category=tmpl.category,
        formula=tmpl.formula,
        intervals=tmpl.intervals,
        notes=spelled_notes,
        character_notes=tmpl.character_notes,
        avoid_notes=tmpl.avoid_notes,
        description=tmpl.description,
    )


def get_relative_minor(major_root: str) -> str:
    """Returns the relative minor root note for a given major key (down 3 semitones).
    
    Example: 'C' -> 'A', 'G' -> 'E', 'F' -> 'D', 'Eb' -> 'C'
    """
    # 9 semitones up is the 6th degree (relative minor)
    return get_note_at_interval(major_root, "6", mode=NotationMode.PRACTICAL)


def get_relative_major(minor_root: str) -> str:
    """Returns the relative major root note for a given minor key (up 3 semitones).
    
    Example: 'A' -> 'C', 'E' -> 'G', 'D' -> 'F', 'C' -> 'Eb'
    """
    # 3 semitones up is the minor 3rd (relative major)
    return get_note_at_interval(minor_root, "b3", mode=NotationMode.PRACTICAL)


def list_available_scales() -> List[str]:
    """Returns list of all available scale type identifiers."""
    return sorted(list(SCALE_TEMPLATES.keys()))
