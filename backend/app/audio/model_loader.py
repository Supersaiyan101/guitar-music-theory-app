"""ONNX Model loader and session manager for Spotify basic-pitch.
Runs zero-dependency inference using onnxruntime on GPU (CUDA) or CPU.
"""

import os
import sys
import urllib.request
from pathlib import Path
from typing import Optional
from loguru import logger
import onnxruntime as ort

MODEL_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "models"
MODEL_PATH = MODEL_DIR / "nmp.onnx"

PRIMARY_MODEL_URL = "https://huggingface.co/AEmotionStudio/basic-pitch-onnx-models/resolve/main/nmp.onnx"
FALLBACK_MODEL_URL = "https://raw.githubusercontent.com/spotify/basic-pitch/main/basic_pitch/saved_models/icassp_2022/nmp.onnx"

# Global cached session
_cached_session: Optional[ort.InferenceSession] = None


def ensure_audio_model_present(model_path: Optional[Path] = None) -> Path:
    """Ensures the Spotify basic-pitch ONNX model exists on local disk.
    If missing, automatically downloads from verified HuggingFace mirror.
    """
    target = model_path or MODEL_PATH
    if target.exists() and target.stat().st_size > 100000:
        return target

    target.parent.mkdir(parents=True, exist_ok=True)
    logger.info(f"Downloading basic-pitch ONNX model to {target}...")

    urls = [PRIMARY_MODEL_URL, FALLBACK_MODEL_URL]
    last_err = None

    for url in urls:
        try:
            logger.info(f"Fetching audio model from {url}...")
            urllib.request.urlretrieve(url, target)
            if target.exists() and target.stat().st_size > 100000:
                logger.info(f"Model downloaded successfully ({target.stat().st_size} bytes).")
                return target
        except Exception as e:
            last_err = e
            logger.warning(f"Failed download from {url}: {e}")

    raise RuntimeError(f"Could not download basic-pitch ONNX model: {last_err}")


def get_audio_inference_session(
    model_path: Optional[Path] = None,
    force_cpu: bool = False
) -> ort.InferenceSession:
    """Returns a singleton onnxruntime InferenceSession.
    Attempts CUDAExecutionProvider first (if available on RTX GPU), falling back to CPU.
    """
    global _cached_session

    if _cached_session is not None and not force_cpu:
        return _cached_session

    resolved_path = ensure_audio_model_present(model_path)

    # Configure execution providers
    available_providers = ort.get_available_providers()
    selected_providers = []

    if not force_cpu and "CUDAExecutionProvider" in available_providers:
        selected_providers.append("CUDAExecutionProvider")
    selected_providers.append("CPUExecutionProvider")

    # Set thread options for low latency
    sess_options = ort.SessionOptions()
    sess_options.intra_op_num_threads = min(4, os.cpu_count() or 1)
    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

    session = ort.InferenceSession(
        str(resolved_path),
        sess_options=sess_options,
        providers=selected_providers
    )

    if not force_cpu:
        _cached_session = session

    logger.info(f"Loaded basic-pitch ONNX session with providers: {session.get_providers()}")
    return session
