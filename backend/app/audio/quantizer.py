"""Rhythmic Quantizer for transcribed guitar notes and audio licks.

Quantizes continuous note onsets and durations to musical subdivision grids
(1/4, 1/8, 1/16, 1/32, and triplets), computes measure/beat positions,
and estimates tempo from inter-onset intervals (IOIs).
"""

from typing import List, Optional
import numpy as np

from backend.app.schemas.audio import (
    TranscribedNoteEvent,
    QuantizedNoteEvent,
    QuantizeResult,
)


def estimate_tempo_from_onsets(onsets: List[float], fallback_bpm: float = 120.0) -> float:
    """Estimates musical tempo in BPM from a list of note onset timestamps (in seconds).
    
    Uses Inter-Onset Interval (IOI) clustering mapped to standard musical tempos [60, 180].
    """
    if len(onsets) < 3:
        return float(fallback_bpm)

    sorted_onsets = sorted(onsets)
    iois = []
    for i in range(len(sorted_onsets) - 1):
        delta = sorted_onsets[i + 1] - sorted_onsets[i]
        # Ignore sub-32nd note flams or long multi-second pauses
        if 0.08 <= delta <= 2.5:
            iois.append(delta)

    if not iois:
        return float(fallback_bpm)

    candidate_bpms: List[float] = []
    for delta in iois:
        # Candidate interpretations: delta is quarter note, eighth note, or sixteenth note
        for mult in [1.0, 2.0, 4.0, 0.5]:
            quarter_len = delta * mult
            if quarter_len > 0:
                raw_bpm = 60.0 / quarter_len
                # Fold into [65, 175] tempo bracket
                folded_bpm = raw_bpm
                while folded_bpm < 65.0:
                    folded_bpm *= 2.0
                while folded_bpm > 175.0:
                    folded_bpm /= 2.0
                candidate_bpms.append(folded_bpm)

    if not candidate_bpms:
        return float(fallback_bpm)

    # Use median of candidate BPMs rounded to nearest integer
    est_bpm = float(np.median(candidate_bpms))
    return round(est_bpm, 1)


def get_grid_step_seconds(bpm: float, grid: str) -> float:
    """Returns the time duration in seconds of a single grid step given tempo and subdivision."""
    safe_bpm = max(30.0, min(300.0, bpm))
    quarter_sec = 60.0 / safe_bpm

    if grid == "1/4":
        return quarter_sec
    elif grid == "1/8":
        return quarter_sec / 2.0
    elif grid == "1/16":
        return quarter_sec / 4.0
    elif grid == "1/32":
        return quarter_sec / 8.0
    elif grid == "1/8T":
        # 3 triplets per quarter beat
        return quarter_sec / 3.0
    elif grid == "1/16T":
        # 6 triplets per quarter beat (3 per eighth beat)
        return quarter_sec / 6.0
    else:
        # Default to sixteenth note
        return quarter_sec / 4.0


def determine_rhythmic_name(duration_beats: float) -> str:
    """Maps duration in quarter-note beats to a common musical rhythmic label."""
    if duration_beats >= 3.5:
        return "whole"
    elif duration_beats >= 2.5:
        return "dotted half"
    elif duration_beats >= 1.75:
        return "half"
    elif duration_beats >= 1.25:
        return "dotted quarter"
    elif duration_beats >= 0.75:
        return "1/4"
    elif duration_beats >= 0.45:
        return "1/8"
    elif duration_beats >= 0.2:
        return "1/16"
    else:
        return "1/32"


def select_auto_grid(notes: List[TranscribedNoteEvent], bpm: float) -> str:
    """Determines the optimal rhythmic grid ('1/8', '1/16', or '1/8T') that minimizes quantization error."""
    if not notes:
        return "1/16"

    candidate_grids = ["1/8", "1/16", "1/8T"]
    best_grid = "1/16"
    lowest_error = float("inf")

    onsets = [n.start_time for n in notes]

    for grid in candidate_grids:
        step = get_grid_step_seconds(bpm, grid)
        # Compute mean absolute error between original and snapped onsets
        errors = [abs(t - round(t / step) * step) for t in onsets]
        mean_err = float(np.mean(errors))

        # Give 1/8 note a slight penalty reduction to favor simpler tabs when clean
        effective_error = mean_err
        if grid == "1/8":
            effective_error *= 0.95
        elif grid == "1/8T":
            # Only favor triplets if noticeably lower error than straight eighths/sixteenths
            effective_error *= 1.1

        if effective_error < lowest_error:
            lowest_error = effective_error
            best_grid = grid

    return best_grid


def quantize_note_events(
    notes: List[TranscribedNoteEvent],
    bpm: Optional[float] = None,
    grid: str = "auto",
    time_signature: str = "4/4",
) -> QuantizeResult:
    """Quantizes transcribed notes onto a musical rhythmic grid with measure/beat coordinates.
    
    Args:
        notes: List of TranscribedNoteEvent items from audio transcription.
        bpm: Beats per minute. If None, estimated from onsets.
        grid: Subdivision ('auto', '1/4', '1/8', '1/16', '1/32', '1/8T', '1/16T').
        time_signature: Meter e.g. '4/4', '3/4'.
        
    Returns:
        QuantizeResult containing aligned QuantizedNoteEvents and meter parameters.
    """
    if bpm is None or bpm <= 0:
        onsets = [n.start_time for n in notes]
        resolved_bpm = estimate_tempo_from_onsets(onsets, fallback_bpm=120.0)
    else:
        resolved_bpm = float(bpm)

    if grid == "auto":
        resolved_grid = select_auto_grid(notes, resolved_bpm)
    else:
        resolved_grid = grid

    # Parse meter (default 4/4)
    try:
        num_str, denom_str = time_signature.split("/")
        beats_per_measure = int(num_str)
    except Exception:
        beats_per_measure = 4

    quarter_sec = 60.0 / resolved_bpm
    grid_step_sec = get_grid_step_seconds(resolved_bpm, resolved_grid)

    # Slots per measure calculation
    slots_per_beat = max(1, int(round(quarter_sec / grid_step_sec)))
    slots_per_measure = beats_per_measure * slots_per_beat

    quantized_notes: List[QuantizedNoteEvent] = []

    for note in notes:
        # Quantize start time
        q_start = round(note.start_time / grid_step_sec) * grid_step_sec
        # Minimum duration is 1 grid step
        q_dur = max(grid_step_sec, round(note.duration / grid_step_sec) * grid_step_sec)
        q_end = q_start + q_dur

        # Calculate musical position
        total_beats = q_start / quarter_sec
        measure = int(total_beats // beats_per_measure) + 1
        beat_in_measure = (total_beats % beats_per_measure) + 1.0

        # Slot within measure (0 to slots_per_measure - 1)
        total_slots = int(round(q_start / grid_step_sec))
        grid_slot = total_slots % slots_per_measure

        duration_in_beats = q_dur / quarter_sec
        rhythmic_val = determine_rhythmic_name(duration_in_beats)

        quantized_notes.append(
            QuantizedNoteEvent(
                original_start_time=round(note.start_time, 4),
                start_time=round(q_start, 4),
                end_time=round(q_end, 4),
                duration=round(q_dur, 4),
                measure=measure,
                beat_in_measure=round(beat_in_measure, 3),
                total_beats=round(total_beats, 3),
                grid_slot=grid_slot,
                rhythmic_value=rhythmic_val,
                pitch_midi=note.pitch_midi,
                pitch_name=note.pitch_name,
                pitch_class=note.pitch_class,
                articulation=note.articulation,
                tab_position=note.tab_position,
            )
        )

    # Determine total measures
    if quantized_notes:
        total_measures = max([qn.measure for qn in quantized_notes])
    else:
        total_measures = 1

    return QuantizeResult(
        bpm=resolved_bpm,
        grid=resolved_grid,
        time_signature=time_signature,
        slots_per_measure=slots_per_measure,
        total_measures=total_measures,
        notes=quantized_notes,
    )
