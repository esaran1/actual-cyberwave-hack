from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import uuid
import wave
from pathlib import Path
from threading import Lock
from typing import Any

import numpy as np

try:  # pragma: no cover - import guard
    from TTS.api import TTS as CoquiModel
except Exception:  # pragma: no cover - optional dependency stub
    CoquiModel = None  # type: ignore

TTS_MODEL = os.getenv("COQUI_TTS_MODEL", "tts_models/en/vctk/vits")
_TTS_INSTANCE: Any | None = None
_TTS_DISABLED: bool = os.getenv("DISABLE_TTS", "").lower() in {"1", "true", "yes"}
_TTS_INIT_FAILED: bool = False
_TTS_LOCK = Lock()


def _get_tts() -> Any | None:
    global _TTS_INSTANCE
    global _TTS_INIT_FAILED
    if _TTS_DISABLED or _TTS_INIT_FAILED:
        return None
    if CoquiModel is None:
        return None
    with _TTS_LOCK:
        if _TTS_INSTANCE is None:
            try:
                _TTS_INSTANCE = CoquiModel(model_name=TTS_MODEL, progress_bar=False, gpu=False)
            except Exception:
                _TTS_INIT_FAILED = True
                return None
    return _TTS_INSTANCE


def synthesize_example(text: str, tts_dir: Path) -> str:
    """Generate an example clip for the provided text."""
    cleaned = text.strip() or "example"
    tts_dir.mkdir(parents=True, exist_ok=True)
    tts_id = f"tts_{uuid.uuid4().hex}"
    out_path = tts_dir / f"{tts_id}.wav"

    tts = _get_tts()
    if tts is not None:
        try:
            tts.tts_to_file(text=cleaned, file_path=str(out_path))
            return tts_id
        except Exception:
            pass

    if _synthesize_with_say(cleaned, out_path):
        return tts_id

    _write_placeholder(cleaned, out_path)
    return tts_id


def _synthesize_with_say(text: str, out_path: Path) -> bool:
    if shutil.which("say") is None:
        return False
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmpdir:
        aiff_path = Path(tmpdir) / "tts.aiff"
        process = subprocess.run(
            ["say", text, "-o", str(aiff_path)],
            capture_output=True,
            text=True,
        )
        if process.returncode != 0 or not aiff_path.exists():
            return False
        ffmpeg = shutil.which("ffmpeg")
        if ffmpeg is None:
            return False
        convert = subprocess.run(
            [ffmpeg, "-y", "-i", str(aiff_path), str(out_path)],
            capture_output=True,
            text=True,
        )
        return convert.returncode == 0 and out_path.exists()


def _write_placeholder(label: str, out_path: Path) -> None:
    sample_rate = 16000
    duration = 1.2
    freq = 440
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    audio = 0.2 * np.sin(2 * np.pi * freq * t)
    audio = (audio * 32767).astype(np.int16)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out_path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio.tobytes())
