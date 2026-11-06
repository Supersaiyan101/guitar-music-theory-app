"""Audio ingestion, transcription, and tablature endpoints."""

from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from loguru import logger

from backend.app.audio.articulations import enrich_note_articulations
from backend.app.audio.chord_extractor import build_progression_from_audio_notes
from backend.app.audio.fret_solver import solve_optimal_guitar_tabs
from backend.app.audio.model_loader import get_audio_inference_session
from backend.app.audio.transcriber import get_audio_transcriber
from backend.app.schemas.audio import TranscribedLickResponse, TranscribedProgressionResponse
from backend.app.theory.progression import analyze_progression

router = APIRouter(prefix="/api/audio", tags=["audio"])


@router.get("/status")
def get_audio_engine_status():
    """Returns the status and active hardware providers for the basic-pitch ONNX engine."""
    session = get_audio_inference_session()
    providers = session.get_providers()
    device = "cuda" if "CUDAExecutionProvider" in providers else "cpu"
    return {
        "status": "online",
        "engine": "spotify-basic-pitch-onnx",
        "device": device,
        "active_providers": providers,
    }


@router.post("/transcribe-lick", response_model=TranscribedLickResponse)
async def transcribe_guitar_lick(
    file: UploadFile = File(...),
    target_zone_fret: int = Form(default=7),
):
    """Transcribes an uploaded audio file (.wav, .mp3) of a guitar lick or solo,
    enriches with guitar articulations (bends, vibrato, slides), and runs
    Viterbi dynamic programming to solve the optimal physical guitar tablature.
    """
    try:
        audio_bytes = await file.read()
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

        transcriber = get_audio_transcriber()
        raw_notes, total_duration = transcriber.transcribe(audio_bytes)

        if not raw_notes:
            return TranscribedLickResponse(
                detected_bpm=120.0,
                detected_key="A",
                detected_mode="minor",
                primary_caged_box="G",
                hand_position_zone="Frets 5–8",
                notes=[],
                total_duration=total_duration,
                inference_device="cpu",
            )

        # Step 1: Detect articulations (bends, slides, slurs)
        articulated_notes = enrich_note_articulations(raw_notes)

        # Step 2: Solve optimal guitar tablature via Viterbi solver
        solved_notes, caged_box, hand_zone = solve_optimal_guitar_tabs(
            articulated_notes, target_zone_fret=target_zone_fret
        )

        # Step 3: Estimate key and mode from note pitch classes
        unique_pcs = list(dict.fromkeys(n.pitch_class for n in solved_notes))
        estimated_key = unique_pcs[0] if unique_pcs else "A"
        estimated_mode = "minor" if any(n.pitch_class in ["C", "F", "G"] for n in solved_notes) else "major"

        return TranscribedLickResponse(
            detected_bpm=120.0,
            detected_key=estimated_key,
            detected_mode=estimated_mode,
            primary_caged_box=caged_box,
            hand_position_zone=hand_zone,
            notes=solved_notes,
            total_duration=round(total_duration, 2),
            inference_device="cpu",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in transcribe_guitar_lick: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/transcribe-progression", response_model=TranscribedProgressionResponse)
async def transcribe_guitar_progression(
    file: UploadFile = File(...),
    bpm: float = Form(default=120.0),
):
    """Transcribes an uploaded polyphonic audio track of a chord progression,
    identifies chord roots and qualities, performs Krumhansl-Schmuckler key analysis,
    and returns a structured progression ready for ProgressionTimeline.
    """
    try:
        audio_bytes = await file.read()
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

        transcriber = get_audio_transcriber()
        raw_notes, total_duration = transcriber.transcribe(audio_bytes)

        progression_resp = build_progression_from_audio_notes(
            raw_notes, total_duration=total_duration, bpm=bpm
        )
        return progression_resp

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in transcribe_guitar_progression: {e}")
        raise HTTPException(status_code=500, detail=f"Progression transcription failed: {str(e)}")
