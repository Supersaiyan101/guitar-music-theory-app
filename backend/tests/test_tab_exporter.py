"""Unit tests for rhythmic quantization, ASCII tab export, and binary MIDI export."""

import pytest
from starlette.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.audio import (
    TranscribedNoteEvent,
    GuitarTabPosition,
    GuitarArticulationEnum,
    AsciiTabExportRequest,
    MidiExportRequest,
)
from backend.app.audio.quantizer import (
    estimate_tempo_from_onsets,
    quantize_note_events,
    get_grid_step_seconds,
)
from backend.app.audio.tab_exporter import export_ascii_tab, format_note_token
from backend.app.audio.midi_exporter import export_midi_bytes, encode_vlq


@pytest.fixture
def client():
    return TestClient(app)


def test_estimate_tempo_from_onsets():
    """Verifies that inter-onset intervals accurately estimate musical tempo."""
    # 0.5s intervals at 120 BPM
    onsets_120 = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5]
    bpm = estimate_tempo_from_onsets(onsets_120)
    assert 115.0 <= bpm <= 125.0

    # 0.375s intervals (dotted eighths or 160 bpm)
    onsets_160 = [0.0, 0.375, 0.75, 1.125, 1.5]
    bpm_160 = estimate_tempo_from_onsets(onsets_160)
    assert 60.0 <= bpm_160 <= 180.0

    # Too few onsets fallback
    assert estimate_tempo_from_onsets([0.1, 0.2]) == 120.0


def test_quantize_note_events_straight():
    """Verifies note onset snapping to 1/8 note subdivisions and measure assignments."""
    notes = [
        TranscribedNoteEvent(start_time=0.03, end_time=0.48, duration=0.45, pitch_midi=60, pitch_name="C4", pitch_class="C"),
        TranscribedNoteEvent(start_time=0.52, end_time=0.99, duration=0.47, pitch_midi=62, pitch_name="D4", pitch_class="D"),
        TranscribedNoteEvent(start_time=1.01, end_time=1.49, duration=0.48, pitch_midi=64, pitch_name="E4", pitch_class="E"),
        TranscribedNoteEvent(start_time=2.02, end_time=2.51, duration=0.49, pitch_midi=65, pitch_name="F4", pitch_class="F"),
    ]

    res = quantize_note_events(notes, bpm=120.0, grid="1/8")
    assert res.bpm == 120.0
    assert res.grid == "1/8"
    assert len(res.notes) == 4

    # Note 1: at start 0.0s, measure 1, beat 1.0
    assert res.notes[0].start_time == 0.0
    assert res.notes[0].measure == 1
    assert res.notes[0].beat_in_measure == 1.0

    # Note 4: at start 2.0s (measure 2 beat 1 in 4/4 at 120 BPM where 1 bar = 2.0s)
    assert res.notes[3].measure == 2
    assert res.notes[3].beat_in_measure == 1.0


def test_quantize_triplet_grid():
    """Verifies that triplet subdivision (1/8T) assigns 3 slots per quarter beat."""
    step_sec = get_grid_step_seconds(bpm=120.0, grid="1/8T")
    # 60 / 120 = 0.5s per quarter, so 1/8T is 0.5 / 3 = 0.16667s
    assert round(step_sec, 3) == 0.167

    notes = [
        TranscribedNoteEvent(start_time=0.0, end_time=0.16, duration=0.16, pitch_midi=60, pitch_name="C4", pitch_class="C"),
        TranscribedNoteEvent(start_time=0.17, end_time=0.33, duration=0.16, pitch_midi=62, pitch_name="D4", pitch_class="D"),
        TranscribedNoteEvent(start_time=0.34, end_time=0.50, duration=0.16, pitch_midi=64, pitch_name="E4", pitch_class="E"),
    ]
    res = quantize_note_events(notes, bpm=120.0, grid="1/8T")
    assert res.slots_per_measure == 12  # 4 beats * 3 triplets = 12


def test_format_note_tokens():
    """Verifies formatting of individual guitar tab articulation tokens."""
    assert format_note_token(7, GuitarArticulationEnum.NORMAL) == "7"
    assert format_note_token(7, GuitarArticulationEnum.BEND_FULL) == "7b9"
    assert format_note_token(7, GuitarArticulationEnum.BEND_HALF) == "7b8"
    assert format_note_token(7, GuitarArticulationEnum.VIBRATO) == "7~"
    assert format_note_token(5, GuitarArticulationEnum.HAMMER_ON, next_fret=7) == "5h7"
    assert format_note_token(7, GuitarArticulationEnum.PULL_OFF, next_fret=5) == "7p5"
    assert format_note_token(7, GuitarArticulationEnum.SLIDE_UP, next_fret=9) == "7/9"
    assert format_note_token(9, GuitarArticulationEnum.SLIDE_DOWN, next_fret=7) == "9\\7"


def test_export_ascii_tab_structure():
    """Verifies standard 6-line guitar tab rendering."""
    notes = [
        TranscribedNoteEvent(
            start_time=0.0,
            end_time=0.25,
            duration=0.25,
            pitch_midi=60,
            pitch_name="C4",
            pitch_class="C",
            tab_position=GuitarTabPosition(string=2, fret=1, note="C4", pitch_midi=60),
        ),
        TranscribedNoteEvent(
            start_time=0.5,
            end_time=0.75,
            duration=0.25,
            pitch_midi=67,
            pitch_name="G4",
            pitch_class="G",
            articulation=GuitarArticulationEnum.BEND_FULL,
            tab_position=GuitarTabPosition(string=1, fret=3, note="G4", pitch_midi=67, articulation=GuitarArticulationEnum.BEND_FULL),
        ),
    ]

    res = export_ascii_tab(notes, bpm=120.0, grid="1/8", title="Test Solo", key="C")
    ascii_str = res.ascii_tab

    assert "# Test Solo" in ascii_str
    assert "120.0 BPM" in ascii_str
    assert "Key: C" in ascii_str
    assert "e|" in ascii_str
    assert "B|" in ascii_str
    assert "G|" in ascii_str
    assert "D|" in ascii_str
    assert "A|" in ascii_str
    assert "E|" in ascii_str
    assert "3b5" in ascii_str
    assert "1" in ascii_str


def test_export_ascii_tab_empty():
    """Verifies graceful handling of empty transcribed notes list."""
    res = export_ascii_tab([], bpm=120.0)
    assert res.total_measures == 1
    assert "e|---------------------------------|" in res.ascii_tab


def test_export_midi_binary():
    """Verifies pure Python binary MIDI generation conforms to SMF Type 0 standard."""
    notes = [
        TranscribedNoteEvent(
            start_time=0.0,
            end_time=0.5,
            duration=0.5,
            pitch_midi=60,
            pitch_name="C4",
            pitch_class="C",
        ),
        TranscribedNoteEvent(
            start_time=0.5,
            end_time=1.0,
            duration=0.5,
            pitch_midi=64,
            pitch_name="E4",
            pitch_class="E",
            articulation=GuitarArticulationEnum.BEND_FULL,
        ),
    ]

    midi_bytes = export_midi_bytes(notes, bpm=120.0, track_name="Solo 1")
    assert isinstance(midi_bytes, bytes)
    assert midi_bytes.startswith(b"MThd")
    assert b"MTrk" in midi_bytes

    # Track Name
    assert b"Solo 1" in midi_bytes

    # Check Note On event for C4 (pitch 60 = 0x3C, status 0x90)
    assert b"\x90\x3C" in midi_bytes

    # Check Pitch Bend event (0xE0) exists due to BEND_FULL
    assert b"\xE0" in midi_bytes


def test_api_export_endpoints(client):
    """Verifies the FastAPI REST endpoints for ASCII tab and MIDI generation."""
    test_note = {
        "start_time": 0.0,
        "end_time": 0.5,
        "duration": 0.5,
        "pitch_midi": 69,
        "pitch_name": "A4",
        "pitch_class": "A",
        "tab_position": {
            "string": 1,
            "fret": 5,
            "note": "A4",
            "pitch_midi": 69,
            "articulation": "normal",
            "bend_semitones": 0.0,
            "confidence": 1.0,
        },
    }

    # Test POST /api/audio/export-tab-ascii
    tab_req = {
        "notes": [test_note],
        "bpm": 120.0,
        "grid": "1/8",
        "title": "API Test Lick",
    }
    tab_res = client.post("/api/audio/export-tab-ascii", json=tab_req)
    assert tab_res.status_code == 200
    tab_data = tab_res.json()
    assert "ascii_tab" in tab_data
    assert "e|" in tab_data["ascii_tab"]
    assert tab_data["bpm"] == 120.0

    # Test POST /api/audio/export-midi
    midi_req = {
        "notes": [test_note],
        "bpm": 120.0,
        "time_signature": "4/4",
        "track_name": "API_Lick",
        "include_pitch_bends": True,
    }
    midi_res = client.post("/api/audio/export-midi", json=midi_req)
    assert midi_res.status_code == 200
    assert midi_res.headers["content-type"] == "audio/midi"
    assert "attachment; filename=" in midi_res.headers["content-disposition"]
    assert midi_res.content.startswith(b"MThd")
