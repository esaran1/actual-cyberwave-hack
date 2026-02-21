from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Union

AUDIO_FORMAT = "wav"
SAMPLE_RATE = 16000
CHANNELS = 1
PLAYBACK_SAMPLE_RATE = 48000
PLAYBACK_CHANNELS = 2


def convert_to_wav(input_path: Union[str, Path], output_path: Union[str, Path]) -> Path:
    """Convert arbitrary audio input to mono 16k WAV via ffmpeg."""
    input_path = Path(input_path)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-ac",
        str(CHANNELS),
        "-ar",
        str(SAMPLE_RATE),
        str(output_path),
    ]
    process = subprocess.run(cmd, capture_output=True, text=True)
    if process.returncode != 0:
        raise RuntimeError(f"ffmpeg conversion failed: {process.stderr.strip()}")
    return output_path


def convert_to_playback_wav(input_path: Union[str, Path], output_path: Union[str, Path]) -> Path:
    """Create a higher-fidelity WAV for playback (stereo 48k) via ffmpeg."""
    input_path = Path(input_path)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-ac",
        str(PLAYBACK_CHANNELS),
        "-ar",
        str(PLAYBACK_SAMPLE_RATE),
        str(output_path),
    ]
    process = subprocess.run(cmd, capture_output=True, text=True)
    if process.returncode != 0:
        raise RuntimeError(f"ffmpeg playback conversion failed: {process.stderr.strip()}")
    return output_path
