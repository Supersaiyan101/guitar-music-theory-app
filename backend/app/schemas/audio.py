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
