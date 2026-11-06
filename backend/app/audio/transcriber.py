"""ONNX Transcription engine for Spotify basic-pitch.
Runs neural inference on audio windows, stitches overlapping frames,
and extracts note events with onset timing and pitch contours.
"""

from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from loguru import logger

from backend.app.audio.model_loader import get_audio_inference_session
from backend.app.audio.preprocessor import (
    HOP_SIZE,
    TARGET_SAMPLE_RATE,
    WINDOW_SIZE,
    create_audio_windows,
    preprocess_audio_pipeline,
)
from backend.app.schemas.audio import GuitarArticulationEnum, TranscribedNoteEvent

# MIDI constants
MIDI_OFFSET = 21  # Model covers MIDI 21 (A0) to 108 (C8) = 88 semitones
NUM_SEMITONES = 88
BINS_PER_SEMITONE = 3
FFT_HOP = 256
FRAMES_PER_SEC = TARGET_SAMPLE_RATE / FFT_HOP  # ~86.13 frames/sec (~11.6 ms per frame)

# Note names for pitch conversion
NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def midi_to_note_name(midi_number: int) -> Tuple[str, str]:
    """Converts MIDI number to (pitch_name_with_octave, pitch_class).
    Example: 60 -> ('C4', 'C'), 69 -> ('A4', 'A').
    """
    pitch_class = NOTE_NAMES[midi_number % 12]
    octave = (midi_number // 12) - 1
    return f"{pitch_class}{octave}", pitch_class


class BasicPitchTranscriber:
    """High-performance polyphonic audio transcriber using basic-pitch ONNX model."""

    def __init__(
        self,
        onset_threshold: float = 0.40,
        frame_threshold: float = 0.18,
        min_note_len_ms: float = 45.0,
    ):
        self.onset_threshold = onset_threshold
        self.frame_threshold = frame_threshold
        self.min_note_len_frames = max(2, int((min_note_len_ms / 1000.0) * FRAMES_PER_SEC))
        self.session = get_audio_inference_session()
        self.input_name = self.session.get_inputs()[0].name

    def infer_windows(
        self,
        batch_windows: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Runs batch through ONNX model.
        Returns:
            notes_batch: [batch_size, 172, 88]
            onsets_batch: [batch_size, 172, 88]
            contours_batch: [batch_size, 172, 264]
        """
        # Run inference in chunks of 8 windows to avoid excessive memory spike
        chunk_size = 8
        num_windows = batch_windows.shape[0]

        notes_chunks = []
        onsets_chunks = []
        contours_chunks = []

        for start in range(0, num_windows, chunk_size):
            end = min(start + chunk_size, num_windows)
            chunk = batch_windows[start:end]

            outputs = self.session.run(None, {self.input_name: chunk})
            # Outputs mapping based on ONNX tensor shapes:
            # outputs[0]: notes [N, 172, 88]
            # outputs[1]: onsets [N, 172, 88]
            # outputs[2]: contours [N, 172, 264]
            notes_chunks.append(outputs[0])
            onsets_chunks.append(outputs[1])
            contours_chunks.append(outputs[2])

        notes_batch = np.concatenate(notes_chunks, axis=0)
        onsets_batch = np.concatenate(onsets_chunks, axis=0)
        contours_batch = np.concatenate(contours_chunks, axis=0)

        return notes_batch, onsets_batch, contours_batch

    def stitch_windows(
        self,
        notes_batch: np.ndarray,
        onsets_batch: np.ndarray,
        contours_batch: np.ndarray,
        window_timestamps: List[float],
        total_duration: float,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Stitches overlapping window frames into continuous time-series activation matrices.
        Uses overlap-add with triangular/linear weighting.
        """
        total_frames = int(np.ceil(total_duration * FRAMES_PER_SEC)) + 20
        frames_per_window = notes_batch.shape[1]  # 172

        global_notes = np.zeros((total_frames, NUM_SEMITONES), dtype=np.float32)
        global_onsets = np.zeros((total_frames, NUM_SEMITONES), dtype=np.float32)
        global_contours = np.zeros((total_frames, NUM_SEMITONES * BINS_PER_SEMITONE), dtype=np.float32)
        weight_norm = np.zeros(total_frames, dtype=np.float32)

        # Triangular window weighting for seamless cross-fading
        tri_window = scipy_triangle_window(frames_per_window)

        for i, t_start in enumerate(window_timestamps):
            f_start = int(np.round(t_start * FRAMES_PER_SEC))
            f_end = min(f_start + frames_per_window, total_frames)
            span = f_end - f_start

            w = tri_window[:span]
            global_notes[f_start:f_end] += notes_batch[i, :span] * w[:, np.newaxis]
            global_onsets[f_start:f_end] += onsets_batch[i, :span] * w[:, np.newaxis]
            global_contours[f_start:f_end] += contours_batch[i, :span] * w[:, np.newaxis]
            weight_norm[f_start:f_end] += w

        # Normalize by weight accumulator
        weight_norm[weight_norm < 1e-4] = 1.0
        global_notes /= weight_norm[:, np.newaxis]
        global_onsets /= weight_norm[:, np.newaxis]
        global_contours /= weight_norm[:, np.newaxis]

        return global_notes, global_onsets, global_contours

    def extract_notes_from_activations(
        self,
        notes_matrix: np.ndarray,
        onsets_matrix: np.ndarray,
        contours_matrix: np.ndarray,
        start_offset: float = 0.0,
    ) -> List[TranscribedNoteEvent]:
        """Peak-picks note events from stitched activation matrices."""
        note_events: List[TranscribedNoteEvent] = []
        num_frames, num_pitches = notes_matrix.shape

        for p_idx in range(num_pitches):
            midi_pitch = p_idx + MIDI_OFFSET
            pitch_name, pitch_class = midi_to_note_name(midi_pitch)

            active_note_start = None
            max_activation = 0.0

            for f in range(num_frames):
                is_onset = onsets_matrix[f, p_idx] >= self.onset_threshold
                is_active = notes_matrix[f, p_idx] >= self.frame_threshold

                # Onset while already sounding -> terminate previous note and begin new
                if is_onset and active_note_start is not None and (f - active_note_start >= self.min_note_len_frames):
                    start_sec = (active_note_start / FRAMES_PER_SEC) + start_offset
                    end_sec = (f / FRAMES_PER_SEC) + start_offset
                    dur = end_sec - start_sec

                    # Extract pitch contour segment for bend analysis
                    contour_slice = contours_matrix[active_note_start:f, p_idx * 3 : (p_idx + 1) * 3]
                    bend_cents = estimate_pitch_bend_cents(contour_slice)

                    note_events.append(
                        TranscribedNoteEvent(
                            start_time=round(start_sec, 3),
                            end_time=round(end_sec, 3),
                            duration=round(dur, 3),
                            pitch_midi=midi_pitch,
                            pitch_name=pitch_name,
                            pitch_class=pitch_class,
                            amplitude=round(float(max_activation), 3),
                            articulation=GuitarArticulationEnum.NORMAL,
                            bend_cents=round(bend_cents, 1) if abs(bend_cents) > 15 else None,
                        )
                    )
                    active_note_start = f
                    max_activation = notes_matrix[f, p_idx]

                # Trigger new note on onset or sustained activation
                elif is_onset and active_note_start is None:
                    active_note_start = f
                    max_activation = notes_matrix[f, p_idx]

                elif is_active and active_note_start is not None:
                    max_activation = max(max_activation, notes_matrix[f, p_idx])

                # Note ended (below threshold)
                elif not is_active and active_note_start is not None:
                    if f - active_note_start >= self.min_note_len_frames:
                        start_sec = (active_note_start / FRAMES_PER_SEC) + start_offset
                        end_sec = (f / FRAMES_PER_SEC) + start_offset
                        dur = end_sec - start_sec

                        contour_slice = contours_matrix[active_note_start:f, p_idx * 3 : (p_idx + 1) * 3]
                        bend_cents = estimate_pitch_bend_cents(contour_slice)

                        note_events.append(
                            TranscribedNoteEvent(
                                start_time=round(start_sec, 3),
                                end_time=round(end_sec, 3),
                                duration=round(dur, 3),
                                pitch_midi=midi_pitch,
                                pitch_name=pitch_name,
                                pitch_class=pitch_class,
                                amplitude=round(float(max_activation), 3),
                                articulation=GuitarArticulationEnum.NORMAL,
                                bend_cents=round(bend_cents, 1) if abs(bend_cents) > 15 else None,
                            )
                        )
                    active_note_start = None
                    max_activation = 0.0

            # Tail cleanup if still active at end of audio
            if active_note_start is not None and (num_frames - active_note_start >= self.min_note_len_frames):
                start_sec = (active_note_start / FRAMES_PER_SEC) + start_offset
                end_sec = (num_frames / FRAMES_PER_SEC) + start_offset
                dur = end_sec - start_sec

                contour_slice = contours_matrix[active_note_start:num_frames, p_idx * 3 : (p_idx + 1) * 3]
                bend_cents = estimate_pitch_bend_cents(contour_slice)

                note_events.append(
                    TranscribedNoteEvent(
                        start_time=round(start_sec, 3),
                        end_time=round(end_sec, 3),
                        duration=round(dur, 3),
                        pitch_midi=midi_pitch,
                        pitch_name=pitch_name,
                        pitch_class=pitch_class,
                        amplitude=round(float(max_activation), 3),
                        articulation=GuitarArticulationEnum.NORMAL,
                        bend_cents=round(bend_cents, 1) if abs(bend_cents) > 15 else None,
                    )
                )

        # Sort notes chronologically by start time
        note_events.sort(key=lambda n: (n.start_time, n.pitch_midi))
        return note_events

    def transcribe(
        self,
        audio_source: Any,
        original_sr: Optional[int] = None,
    ) -> Tuple[List[TranscribedNoteEvent], float]:
        """End-to-end transcription: audio source -> note events + duration."""
        processed_audio, sr, start_offset = preprocess_audio_pipeline(audio_source, original_sr)
        total_duration = len(processed_audio) / sr

        if len(processed_audio) < 1000:
            return [], 0.0

        batch_windows, timestamps = create_audio_windows(processed_audio)
        notes_b, onsets_b, contours_b = self.infer_windows(batch_windows)

        stitched_notes, stitched_onsets, stitched_contours = self.stitch_windows(
            notes_b, onsets_b, contours_b, timestamps, total_duration
        )

        events = self.extract_notes_from_activations(
            stitched_notes, stitched_onsets, stitched_contours, start_offset
        )
        merged_events = merge_consecutive_notes(events, max_gap_sec=0.09)
        return merged_events, total_duration


def merge_consecutive_notes(
    events: List[TranscribedNoteEvent],
    max_gap_sec: float = 0.09,
) -> List[TranscribedNoteEvent]:
    """Merges adjacent fragments of the same pitch that have minimal gaps.
    Preserves guitar string sustain envelope.
    """
    if len(events) <= 1:
        return events

    merged: List[TranscribedNoteEvent] = []
    current = events[0]

    for nxt in events[1:]:
        # Same pitch and close in time
        if nxt.pitch_midi == current.pitch_midi and (nxt.start_time - current.end_time) <= max_gap_sec:
            current = TranscribedNoteEvent(
                start_time=current.start_time,
                end_time=nxt.end_time,
                duration=round(nxt.end_time - current.start_time, 3),
                pitch_midi=current.pitch_midi,
                pitch_name=current.pitch_name,
                pitch_class=current.pitch_class,
                amplitude=max(current.amplitude, nxt.amplitude),
                articulation=current.articulation,
                bend_cents=current.bend_cents or nxt.bend_cents,
                tab_position=current.tab_position or nxt.tab_position,
            )
        else:
            merged.append(current)
            current = nxt

    merged.append(current)
    return merged


def scipy_triangle_window(n: int) -> np.ndarray:
    """Computes a triangular weighting window for cross-fading."""
    w = np.ones(n, dtype=np.float32)
    half = n // 2
    if half > 0:
        fade = np.linspace(0.1, 1.0, half, dtype=np.float32)
        w[:half] = fade
        w[-half:] = fade[::-1]
    return w


def estimate_pitch_bend_cents(contour_slice: np.ndarray) -> float:
    """Estimates average pitch bend deviation in cents from 3 sub-semitone contour bins."""
    if contour_slice.size == 0:
        return 0.0

    # 3 bins: -33.3 cents, 0 cents, +33.3 cents relative to semitone center
    sub_bin_cents = np.array([-33.33, 0.0, 33.33], dtype=np.float32)
    mean_bin_energy = np.mean(contour_slice, axis=0)

    total = np.sum(mean_bin_energy)
    if total < 1e-4:
        return 0.0

    weighted_cents = float(np.sum(mean_bin_energy * sub_bin_cents) / total)
    return weighted_cents


# Global singleton instance
_default_transcriber: Optional[BasicPitchTranscriber] = None


def get_audio_transcriber() -> BasicPitchTranscriber:
    """Returns singleton instance of BasicPitchTranscriber."""
    global _default_transcriber
    if _default_transcriber is None:
        _default_transcriber = BasicPitchTranscriber()
    return _default_transcriber

