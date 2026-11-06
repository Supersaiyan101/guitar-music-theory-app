"""Comprehensive unit tests for audio transcription, articulation detection,
Viterbi guitar tab solver, and chord progression ingestion.
"""

import io
import numpy as np
import pytest
import soundfile as sf
from starlette.testclient import TestClient

from backend.app.audio.articulations import detect_bend_type, enrich_note_articulations
from backend.app.audio.chord_extractor import (
    build_progression_from_audio_notes,
    identify_chord_from_pitch_classes,
)
from backend.app.audio.fret_solver import (
    get_candidate_fret_positions,
    solve_optimal_guitar_tabs,
)
from backend.app.audio.model_loader import get_audio_inference_session
from backend.app.audio.preprocessor import (
    convert_to_mono,
    create_audio_windows,
    normalize_audio,
    preprocess_audio_pipeline,
    resample_audio,
)
from backend.app.main import app
from backend.app.schemas.audio import (
    GuitarArticulationEnum,
    TranscribedNoteEvent,
)


@pytest.fixture
def client():
    return TestClient(app)


def generate_synthetic_wav_bytes(
    freq: float = 440.0,
    duration: float = 0.5,
    sr: int = 22050,
) -> bytes:
    """Generates an in-memory WAV file with a harmonic pluck tone."""
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    env = np.exp(-t * 3.0)
    signal = (np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(4 * np.pi * freq * t)) * env
    signal = (signal / np.max(np.abs(signal)) * 0.8).astype(np.float32)

    buf = io.BytesIO()
    sf.write(buf, signal, sr, format="WAV")
    return buf.getvalue()


def test_audio_model_loader_and_session():
    """Verifies that the ONNX model session loads and reports valid execution providers."""
    session = get_audio_inference_session()
    assert session is not None
    providers = session.get_providers()
    assert len(providers) > 0
    assert "CPUExecutionProvider" in providers or "CUDAExecutionProvider" in providers


def test_audio_preprocessor_resampling_and_normalization():
    """Verifies polyphase resampling, mono conversion, and window slicing."""
    sr_orig = 44100
    t = np.linspace(0, 1.0, sr_orig, endpoint=False)
    stereo_audio = np.stack([np.sin(2 * np.pi * 440 * t), np.sin(2 * np.pi * 440 * t)], axis=1)

    mono = convert_to_mono(stereo_audio)
    assert mono.ndim == 1
    assert len(mono) == sr_orig

    resampled = resample_audio(mono, orig_sr=sr_orig, target_sr=22050)
    assert len(resampled) == 22050

    norm = normalize_audio(resampled, target_db=-1.0)
    peak = np.max(np.abs(norm))
    assert 0.88 <= peak <= 0.90  # -1 dBFS is ~0.891

    batch, timestamps = create_audio_windows(norm)
    assert batch.ndim == 3
    assert batch.shape[1] == 43844
    assert len(timestamps) > 0


def test_guitar_tab_candidate_positions():
    """Verifies all valid string/fret combinations for a given MIDI pitch on standard guitar."""
    # MIDI 60 (Middle C)
    candidates = get_candidate_fret_positions(60)
    # String 2, Fret 1 (59 + 1 = 60)
    assert (2, 1) in candidates
    # String 3, Fret 5 (55 + 5 = 60)
    assert (3, 5) in candidates
    # String 4, Fret 10 (50 + 10 = 60)
    assert (4, 10) in candidates
    # String 5, Fret 15 (45 + 15 = 60)
    assert (5, 15) in candidates
    # String 1 cannot play C4 (open E is 64 > 60)
    assert not any(s == 1 for s, f in candidates)


def test_viterbi_fret_solver_ergonomics():
    """Verifies that Viterbi path optimization keeps consecutive notes localized in a hand box."""
    # A minor pentatonic lick: A3 (57), C4 (60), D4 (62), E4 (64), G4 (67), A4 (69)
    pitches = [57, 60, 62, 64, 67, 69]
    notes = [
        TranscribedNoteEvent(
            start_time=i * 0.2,
            end_time=(i + 1) * 0.2,
            duration=0.2,
            pitch_midi=p,
            pitch_name=f"Note_{p}",
            pitch_class="A",
        )
        for i, p in enumerate(pitches)
    ]

    solved, box, zone = solve_optimal_guitar_tabs(notes, target_zone_fret=7)
    assert len(solved) == len(pitches)
    assert box in ["C", "A", "G", "E", "D"]
    assert zone is not None

    # Check frets are clustered around frets 5-10
    frets = [n.tab_position.fret for n in solved]
    for f in frets:
        assert 4 <= f <= 11


def test_articulation_bend_and_slide_detection():
    """Verifies detection of half/full bends and slides."""
    art_half, semi_half = detect_bend_type(105.0)
    assert art_half == GuitarArticulationEnum.BEND_HALF
    assert semi_half == 1.0

    art_full, semi_full = detect_bend_type(198.0)
    assert art_full == GuitarArticulationEnum.BEND_FULL
    assert semi_full == 2.0

    art_norm, semi_norm = detect_bend_type(10.0)
    assert art_norm == GuitarArticulationEnum.NORMAL
    assert semi_norm == 0.0

    # Test sequence enrichment
    n1 = TranscribedNoteEvent(
        start_time=0.0, end_time=0.3, duration=0.3, pitch_midi=62, pitch_name="D4", pitch_class="D", bend_cents=200.0
    )
    n2 = TranscribedNoteEvent(
        start_time=0.32, end_time=0.6, duration=0.28, pitch_midi=64, pitch_name="E4", pitch_class="E"
    )
    enriched = enrich_note_articulations([n1, n2])
    assert enriched[0].articulation == GuitarArticulationEnum.BEND_FULL
    assert enriched[1].articulation == GuitarArticulationEnum.SLIDE_UP


def test_chord_recognition_and_progression_builder():
    """Verifies identification of chord qualities and harmonic progression grouping."""
    # C major triad: C, E, G
    symbol, root, quality, conf = identify_chord_from_pitch_classes(["C", "E", "G"], bass_note="C")
    assert root == "C"
    assert "maj" in symbol.lower() or symbol == "C"

    # G dominant 7th: G, B, D, F
    g7_symbol, g7_root, g7_quality, _ = identify_chord_from_pitch_classes(["G", "B", "D", "F"], bass_note="G")
    assert g7_root == "G"
    assert "7" in g7_symbol

    # Test build_progression_from_audio_notes
    c_events = [
        TranscribedNoteEvent(
            start_time=0.0, end_time=1.0, duration=1.0, pitch_midi=p, pitch_name="C", pitch_class=c
        )
        for p, c in [(48, "C"), (52, "E"), (55, "G")]
    ]
    f_events = [
        TranscribedNoteEvent(
            start_time=1.0, end_time=2.0, duration=1.0, pitch_midi=p, pitch_name="F", pitch_class=c
        )
        for p, c in [(41, "F"), (45, "A"), (48, "C")]
    ]
    resp = build_progression_from_audio_notes(c_events + f_events, total_duration=2.0)
    assert len(resp.chords_sequence) >= 1
    assert resp.detected_key is not None
    assert len(resp.bars) > 0


def test_audio_api_status(client):
    """Verifies GET /api/audio/status endpoint returns 200 with online engine."""
    res = client.get("/api/audio/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert data["engine"] == "spotify-basic-pitch-onnx"
    assert "active_providers" in data


def test_audio_api_transcribe_endpoints(client):
    """Verifies POST /api/audio/transcribe-lick and /transcribe-progression with WAV audio."""
    wav_bytes = generate_synthetic_wav_bytes(freq=440.0, duration=0.6)

    # 1. Transcribe Lick
    lick_res = client.post(
        "/api/audio/transcribe-lick",
        files={"file": ("test_pluck.wav", wav_bytes, "audio/wav")},
        data={"target_zone_fret": "7"},
    )
    assert lick_res.status_code == 200
    lick_data = lick_res.json()
    assert "notes" in lick_data
    assert "total_duration" in lick_data

    # 2. Transcribe Progression
    prog_res = client.post(
        "/api/audio/transcribe-progression",
        files={"file": ("test_chords.wav", wav_bytes, "audio/wav")},
        data={"bpm": "120.0"},
    )
    assert prog_res.status_code == 200
    prog_data = prog_res.json()
    assert "chords_sequence" in prog_data
    assert "bars" in prog_data
    assert "harmonic_summary" in prog_data
