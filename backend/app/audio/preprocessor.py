"""Audio preprocessing, resampling, and windowing module for guitar transcription.
Handles WAV/MP3 loading, mono downmixing, 22,050 Hz resampling, and normalization.
"""

import io
from pathlib import Path
from typing import BinaryIO, List, Optional, Tuple, Union
import numpy as np
import scipy.signal
import soundfile as sf
from loguru import logger

TARGET_SAMPLE_RATE = 22050
WINDOW_SIZE = 43844  # Spotify basic-pitch native input window length
HOP_SIZE = 21922     # 50% overlap for smooth boundary interpolation
PEAK_TARGET_DB = -1.0
NOISE_GATE_THRESHOLD_DB = -45.0


def load_audio(
    source: Union[str, Path, bytes, BinaryIO, np.ndarray],
    original_sr: Optional[int] = None,
) -> Tuple[np.ndarray, int]:
    """Loads audio from a file path, byte buffer, or numpy array.
    Returns (audio_samples, sample_rate).
    """
    if isinstance(source, np.ndarray):
        if original_sr is None:
            raise ValueError("original_sr must be provided when passing a numpy array.")
        return source.astype(np.float32), original_sr

    if isinstance(source, bytes):
        source = io.BytesIO(source)

    if isinstance(source, (str, Path)):
        source = str(source)

    # soundfile handles WAV, MP3, FLAC, OGG via libsndfile
    data, sr = sf.read(source, dtype="float32", always_2d=False)
    return data, sr


def convert_to_mono(audio: np.ndarray) -> np.ndarray:
    """Downmixes multi-channel audio to mono."""
    if audio.ndim == 1:
        return audio
    if audio.ndim == 2:
        return np.mean(audio, axis=1)
    raise ValueError(f"Unsupported audio shape: {audio.shape}")


def resample_audio(
    audio: np.ndarray,
    orig_sr: int,
    target_sr: int = TARGET_SAMPLE_RATE,
) -> np.ndarray:
    """Resamples audio to target sample rate using scipy polyphase filtering."""
    if orig_sr == target_sr:
        return audio

    # Compute greatest common divisor for rational resampling
    gcd = np.gcd(orig_sr, target_sr)
    up = target_sr // gcd
    down = orig_sr // gcd

    resampled = scipy.signal.resample_poly(audio, up, down).astype(np.float32)
    return resampled


def normalize_audio(
    audio: np.ndarray,
    target_db: float = PEAK_TARGET_DB,
) -> np.ndarray:
    """Peak-normalizes audio to target decibels below full scale (dBFS)."""
    peak = np.max(np.abs(audio))
    if peak <= 1e-7:
        return audio

    target_linear = 10.0 ** (target_db / 20.0)
    gain = target_linear / peak
    return audio * gain


def trim_silence(
    audio: np.ndarray,
    sr: int = TARGET_SAMPLE_RATE,
    threshold_db: float = NOISE_GATE_THRESHOLD_DB,
    min_silence_duration: float = 0.1,
) -> Tuple[np.ndarray, float]:
    """Trims leading and trailing silence/hum below threshold.
    Returns (trimmed_audio, start_offset_seconds).
    """
    threshold_linear = 10.0 ** (threshold_db / 20.0)
    above_threshold = np.where(np.abs(audio) > threshold_linear)[0]

    if len(above_threshold) == 0:
        return audio, 0.0

    margin = int(min_silence_duration * sr)
    start_idx = max(0, above_threshold[0] - margin)
    end_idx = min(len(audio), above_threshold[-1] + margin)

    start_offset = start_idx / sr
    return audio[start_idx:end_idx], start_offset


def preprocess_audio_pipeline(
    source: Union[str, Path, bytes, BinaryIO, np.ndarray],
    original_sr: Optional[int] = None,
    trim: bool = True,
) -> Tuple[np.ndarray, int, float]:
    """Complete preprocessing pipeline: load -> mono -> resample 22kHz -> trim -> normalize.
    Returns (processed_audio, sample_rate, start_offset_sec).
    """
    audio, sr = load_audio(source, original_sr)
    audio = convert_to_mono(audio)
    audio = resample_audio(audio, sr, TARGET_SAMPLE_RATE)

    start_offset = 0.0
    if trim:
        audio, start_offset = trim_silence(audio, TARGET_SAMPLE_RATE)

    audio = normalize_audio(audio)
    return audio, TARGET_SAMPLE_RATE, start_offset


def create_audio_windows(
    audio: np.ndarray,
    window_size: int = WINDOW_SIZE,
    hop_size: int = HOP_SIZE,
) -> Tuple[np.ndarray, List[float]]:
    """Slices 1D audio into 3D batch tensor [num_windows, window_size, 1]
    with corresponding start timestamps in seconds.
    Pads the final window with zeros to ensure complete coverage.
    """
    total_samples = len(audio)
    if total_samples == 0:
        empty = np.zeros((1, window_size, 1), dtype=np.float32)
        return empty, [0.0]

    # If audio is shorter than window_size, pad with zeros
    if total_samples <= window_size:
        padded = np.zeros(window_size, dtype=np.float32)
        padded[:total_samples] = audio
        windows = padded[np.newaxis, :, np.newaxis]
        return windows, [0.0]

    # Slicing with hop
    windows_list = []
    timestamps = []
    pos = 0

    while pos < total_samples:
        chunk = audio[pos : pos + window_size]
        if len(chunk) < window_size:
            padded_chunk = np.zeros(window_size, dtype=np.float32)
            padded_chunk[: len(chunk)] = chunk
            chunk = padded_chunk

        windows_list.append(chunk)
        timestamps.append(pos / TARGET_SAMPLE_RATE)

        pos += hop_size
        # If the remaining audio is less than half a hop, stop
        if pos >= total_samples:
            break

    batch = np.array(windows_list, dtype=np.float32)[:, :, np.newaxis]
    return batch, timestamps
