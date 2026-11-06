"""Pydantic schemas for audio transcription, guitar tab solving, and progression ingestion."""

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class GuitarArticulationEnum(str, Enum):
    """Guitar-specific expressive playing techniques."""
    NORMAL = "normal"
    BEND_HALF = "bend_half"
    BEND_FULL = "bend_full"
    BEND_1_AND_HALF = "bend_1_and_half"
    VIBRATO = "vibrato"
    SLIDE_UP = "slide_up"
    SLIDE_DOWN = "slide_down"
    HAMMER_ON = "hammer_on"
    PULL_OFF = "pull_off"


class GuitarTabPosition(BaseModel):
    """Physical coordinates on the 24-fret guitar matrix for a specific note."""
    string: int = Field(..., ge=1, le=6, description="Guitar string 1 (high E) to 6 (low E)")
    fret: int = Field(..., ge=0, le=24, description="Fret number 0 (open) to 24")
    note: str = Field(..., description="Note name with octave e.g. E4, C#3")
    pitch_midi: int = Field(..., ge=21, le=108, description="MIDI pitch number")
    articulation: GuitarArticulationEnum = Field(default=GuitarArticulationEnum.NORMAL)
    bend_semitones: float = Field(default=0.0, description="Semitones of upward bend if applicable")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class TranscribedNoteEvent(BaseModel):
    """An individual note event detected from polyphonic audio."""
    start_time: float = Field(..., description="Start time in seconds")
    end_time: float = Field(..., description="End time in seconds")
    duration: float = Field(..., description="Duration in seconds")
    pitch_midi: int = Field(..., ge=21, le=108)
    pitch_name: str = Field(..., description="Pitch name with octave e.g. G4")
    pitch_class: str = Field(..., description="Pitch class e.g. G, C#, Bb")
    amplitude: float = Field(default=1.0, ge=0.0, le=1.0)
    articulation: GuitarArticulationEnum = Field(default=GuitarArticulationEnum.NORMAL)
    bend_cents: Optional[float] = Field(default=None, description="Continuous pitch deviation in cents")
    tab_position: Optional[GuitarTabPosition] = Field(
        default=None,
        description="Ergonomically assigned physical guitar coordinate"
    )


class TranscribedChordEvent(BaseModel):
    """A chord recognized across simultaneous polyphonic notes."""
    start_time: float = Field(..., description="Start time in seconds")
    end_time: float = Field(..., description="End time in seconds")
    duration: float = Field(..., description="Duration in seconds")
    chord_symbol: str = Field(..., description="Chord symbol e.g. Am7, G7, Cmaj7")
    root: str = Field(..., description="Root note e.g. A, G, C")
    quality: str = Field(..., description="Quality e.g. min7, dom7, maj7, major, minor")
    roman_numeral: Optional[str] = Field(default=None, description="Harmonic function e.g. ii, V7, Imaj7")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    notes_detected: List[str] = Field(default_factory=list, description="Pitch classes detected in chord")
    bass_note: Optional[str] = Field(default=None, description="Lowest sounding bass pitch")


class TranscribedLickResponse(BaseModel):
    """Full transcription response for a single-note or lead guitar lick."""
    detected_bpm: Optional[float] = Field(default=None, description="Detected tempo in BPM")
    detected_key: Optional[str] = Field(default=None, description="Estimated key center")
    detected_mode: Optional[str] = Field(default=None, description="Estimated mode (major, minor, dorian, etc)")
    primary_caged_box: Optional[str] = Field(default=None, description="Primary CAGED shape identified (C, A, G, E, D)")
    hand_position_zone: Optional[str] = Field(default=None, description="Recommended hand anchor e.g. Frets 5-8")
    notes: List[TranscribedNoteEvent] = Field(default_factory=list)
    total_duration: float = Field(..., description="Total audio length in seconds")
    audio_sample_rate: int = Field(default=22050)
    inference_device: str = Field(default="cpu", description="Hardware used: 'cuda' or 'cpu'")


class TranscribedProgressionResponse(BaseModel):
    """Full transcription response for a multi-chord rhythm progression."""
    detected_bpm: float = Field(default=120.0)
    detected_key: str = Field(default="C")
    detected_mode: str = Field(default="major")
    time_signature: str = Field(default="4/4")
    chords_sequence: List[str] = Field(default_factory=list, description="Array of detected chords in order")
    bars: List[List[Dict[str, Any]]] = Field(
        default_factory=list,
        description="Structured measure strip bars ready for ProgressionTimeline"
    )
    harmonic_summary: str = Field(default="", description="Educational harmonic analysis summary")
    raw_chords: List[TranscribedChordEvent] = Field(default_factory=list)
    total_duration: float = Field(...)
    inference_device: str = Field(default="cpu")



class QuantizedNoteEvent(BaseModel):
    """Note event aligned to a musical rhythmic grid."""
    original_start_time: float = Field(..., description="Unquantized start time in seconds")
    start_time: float = Field(..., description="Quantized start time in seconds")
    end_time: float = Field(..., description="Quantized end time in seconds")
    duration: float = Field(..., description="Quantized duration in seconds")
    measure: int = Field(default=1, ge=1, description="1-indexed measure number")
    beat_in_measure: float = Field(default=1.0, ge=1.0, description="1.0 to 4.99 in 4/4")
    total_beats: float = Field(default=0.0, description="Total beats from measure 1 beat 1")
    grid_slot: int = Field(default=0, description="Zero-indexed slot within the measure (e.g. 0-15 for 16th grid)")
    rhythmic_value: str = Field(default="1/8", description="Musical note value name e.g. 1/16, 1/8, 1/4")
    pitch_midi: int = Field(..., ge=21, le=108)
    pitch_name: str = Field(..., description="Note name with octave e.g. E4")
    pitch_class: str = Field(..., description="Pitch class e.g. E")
    articulation: GuitarArticulationEnum = Field(default=GuitarArticulationEnum.NORMAL)
    tab_position: Optional[GuitarTabPosition] = Field(default=None)


class QuantizeResult(BaseModel):
    """Result of rhythmic quantization across a sequence of transcribed notes."""
    bpm: float = Field(..., description="Beats per minute used for quantization")
    grid: str = Field(default="1/16", description="Subdivision grid: 1/4, 1/8, 1/16, 1/32, 1/8T, 1/16T")
    time_signature: str = Field(default="4/4")
    slots_per_measure: int = Field(default=16, description="Grid subdivision slots per measure")
    total_measures: int = Field(default=1, description="Total number of measures spanned")
    notes: List[QuantizedNoteEvent] = Field(default_factory=list)


class AsciiTabExportRequest(BaseModel):
    """Request payload to render standard 6-line ASCII guitar tablature."""
    notes: List[TranscribedNoteEvent] = Field(..., description="Transcribed guitar notes with tab positions")
    bpm: float = Field(default=120.0, ge=30.0, le=300.0)
    grid: str = Field(default="auto", description="Subdivision grid: 'auto', '1/8', '1/16'")
    title: Optional[str] = Field(default="Guitar Solo Transcription")
    key: Optional[str] = Field(default=None)
    measures_per_line: int = Field(default=2, ge=1, le=4, description="Measures per printed staff block")


class AsciiTabExportResponse(BaseModel):
    """Response containing standard ASCII tablature text."""
    ascii_tab: str = Field(..., description="Standard 6-line ASCII guitar tablature")
    total_measures: int = Field(...)
    quantization_grid: str = Field(...)
    bpm: float = Field(...)


class MidiExportRequest(BaseModel):
    """Request payload to generate a standard MIDI file (.mid)."""
    notes: List[TranscribedNoteEvent] = Field(..., description="Transcribed guitar notes with tab positions")
    bpm: float = Field(default=120.0, ge=30.0, le=300.0)
    time_signature: str = Field(default="4/4")
    track_name: str = Field(default="Guitar Solo")
    include_pitch_bends: bool = Field(default=True)
