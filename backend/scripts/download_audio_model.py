"""Script to pre-download the Spotify basic-pitch ONNX model for offline execution."""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.audio.model_loader import ensure_audio_model_present, get_audio_inference_session


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    print("Checking Spotify basic-pitch ONNX model asset...")
    model_path = ensure_audio_model_present()
    print(f"Model ready at: {model_path} ({model_path.stat().st_size} bytes)")

    sess = get_audio_inference_session()
    print(f"Inference session verified! Active providers: {sess.get_providers()}")


if __name__ == "__main__":
    main()
