"""Pydantic schemas for Guitar Theory Kingdom data models."""
from enum import Enum
from typing import List, Optional, Tuple
from pydantic import BaseModel, Field


class ScaleCategory(str, Enum):
    MAJOR = "major"
    MINOR = "minor"
    PENTATONIC = "pentatonic"
    BLUES = "blues"
    MODE = "mode"
    ALTERED = "altered"
    SYMMETRIC = "symmetric"


class ChordQuality(str, Enum):
    MAJOR = "maj"
    MINOR = "min"
    DOMINANT_SEVENTH = "7"
    MAJOR_SEVENTH = "maj7"
    MINOR_SEVENTH = "min7"
    HALF_DIMINISHED = "m7b5"
    DIMINISHED_SEVENTH = "dim7"
    SUSPENDED_4 = "sus4"
    SUSPENDED_2 = "sus2"
    ALTERED_DOMINANT = "7alt"
    POWER_CHORD = "5"


class NoteDegree(BaseModel):
    """Represents a note in relation to a tonal center."""
    note: str = Field(..., description="Spelled note name, e.g., 'C', 'F#', 'Bb'")
    pitch_class: int = Field(..., ge=0, le=11, description="Chroma index from 0 (C) to 11 (B)")
    interval_degree: str = Field(..., description="Interval symbol relative to root: '1', 'b3', '#4', 'b7', etc.")
    semitones: int = Field(..., ge=0, description="Semitone offset from root note")


class ScaleDefinition(BaseModel):
    """Complete specification of a musical scale or mode."""
    id: str = Field(..., description="Unique slug, e.g. 'c_mixolydian'")
    name: str = Field(..., description="Display name, e.g. 'C Mixolydian'")
    root: str = Field(..., description="Root note name")
    scale_type: str = Field(..., description="Formula type, e.g. 'mixolydian'")
    category: ScaleCategory
    formula: List[int] = Field(..., description="Semitone offsets, e.g. [0, 2, 4, 5, 7, 9, 10]")
    intervals: List[str] = Field(..., description="Interval degree strings, e.g. ['1', '2', '3', '4', '5', '6', 'b7']")
    notes: List[str] = Field(..., description="Spelled notes in the scale, e.g. ['C', 'D', 'E', 'F', 'G', 'A', 'Bb']")
    character_notes: List[str] = Field(default_factory=list, description="Degrees that define the flavor, e.g. ['3', 'b7']")
    avoid_notes: List[str] = Field(default_factory=list, description="Degrees that clash over static tonic harmony, e.g. ['4']")
    description: Optional[str] = None


class ChordDefinition(BaseModel):
    """Representation of a chord with constituent chord tones."""
    symbol: str = Field(..., description="Standard chord symbol, e.g. 'Am7', 'G7#9', 'D/F#'")
    root: str = Field(..., description="Root note, e.g. 'A'")
    quality: ChordQuality
    intervals: List[str] = Field(..., description="Interval degrees, e.g. ['1', 'b3', '5', 'b7']")
    tones: List[str] = Field(..., description="Spelled chord tones, e.g. ['A', 'C', 'E', 'G']")
    bass: Optional[str] = Field(default=None, description="Bass note if slash chord, e.g. 'F#' in 'D/F#'")


class FretCoordinate(BaseModel):
    """A single note location on the guitar fretboard."""
    string: int = Field(..., ge=1, le=6, description="Guitar string number: 1 (High E) to 6 (Low E)")
    fret: int = Field(..., ge=0, le=24, description="Fret index (0 = open string)")
    note: str = Field(..., description="Spelled note at this fret")
    pitch_class: int = Field(..., ge=0, le=11)
    octave: int = Field(..., ge=1, le=7)
    interval: Optional[str] = Field(default=None, description="Degree relative to current root ('1', '3', 'b7')")
    is_root: bool = False
    caged_box: Optional[int] = Field(default=None, ge=1, le=5, description="CAGED box index (1 to 5)")
    technique: Optional[str] = Field(default=None, description="Optional technique flag: 'slide', 'bend', 'hammer', 'root_anchor'")


class CagedBoxDefinition(BaseModel):
    """CAGED system box definition across strings and frets."""
    box_number: int = Field(..., ge=1, le=5)
    shape_letter: str = Field(..., description="'C', 'A', 'G', 'E', or 'D'")
    fret_span: Tuple[int, int] = Field(..., description="(min_fret, max_fret) span on neck")
    coordinates: List[FretCoordinate]


class ProgressionSection(BaseModel):
    """A segment of a progression or song."""
    name: str = Field(..., description="e.g. 'Intro', '12-Bar Blues A', 'Chorus'")
    chords: List[str] = Field(..., description="Chord symbols in sequence")
    roman_numerals: List[str] = Field(default_factory=list, description="Harmonic function tags, e.g. ['I7', 'IV7']")
    bars: int = Field(..., ge=1)
    recommended_scales: List[str] = Field(default_factory=list, description="Recommended soloing scales for this section")


class HarmonicFunction(str, Enum):
    TONIC = "Tonic"
    SUBDOMINANT = "Subdominant"
    DOMINANT = "Dominant"
    SECONDARY_DOMINANT = "Secondary Dominant"
    MODAL_INTERCHANGE = "Modal Interchange"
    TRITONE_SUB = "Tritone Substitution"
    NEAPOLITAN = "Neapolitan"
    PASSING = "Passing"


class VoiceLeadingStep(BaseModel):
    """Individual voice connection between two consecutive chords."""
    from_note: str = Field(..., description="Outgoing note name, e.g. 'C'")
    from_degree: str = Field(..., description="Role in outgoing chord: '3', 'b7', '1', '5'")
    to_note: str = Field(..., description="Incoming target note name, e.g. 'B'")
    to_degree: str = Field(..., description="Role in incoming chord: '3', 'b7', '1', '5'")
    semitone_distance: int = Field(..., description="Chromatic movement distance (-6 to +6)")
    movement_type: str = Field(..., description="'common_tone', 'half_step_down', 'half_step_up', 'whole_step_down', 'whole_step_up', 'leap'")
    is_guide_tone_resolution: bool = Field(default=False, description="True if 7th -> 3rd or 3rd -> 7th or 7th -> 1")


class ChordAnalysis(BaseModel):
    """Deep harmonic and pedagogical analysis for a single chord in a progression."""
    symbol: str
    root: str
    quality: str
    chord_tones: List[str]
    guide_tones: List[str] = Field(default_factory=list, description="Guide tones [3rd, 7th]")
    roman_numeral: str = Field(..., description="Harmonic Roman numeral, e.g. 'ii7', 'V7', 'bVII', 'V7/V'")
    harmonic_function: HarmonicFunction
    pedagogical_insight: str = Field(..., description="Guitarist-oriented theory breakdown explaining why the chord works")
    common_tones_with_next: List[str] = Field(default_factory=list, description="Pitch classes that do not move")
    voice_leading_to_next: List[VoiceLeadingStep] = Field(default_factory=list, description="Voice-leading connections to next chord")
    recommended_scales: dict = Field(default_factory=dict, description="Dictionary of scale suggestions {'parent': '...', 'modal': '...', 'blues': '...', 'spicy': '...'}")


class ProgressionAnalysisResult(BaseModel):
    """Full progression analysis output with key detection and voice leading."""
    key: str
    mode: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    total_bars: int
    chords: List[ChordAnalysis]
    summary_description: str


