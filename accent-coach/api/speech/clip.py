from __future__ import annotations

import uuid
from pathlib import Path
from typing import Tuple

from pydub import AudioSegment

PRE_PAD_MS = 5
POST_PAD_MS = 90
MIN_CLIP_MS = 180
TARGET_PEAK_DBFS = -1.0
MAX_GAIN_DB = 12.0


def load_audio(audio_path: Path) -> AudioSegment:
    return AudioSegment.from_file(audio_path)


def slice_word_clip(
    audio_path: Path,
    start: float,
    end: float,
    clips_dir: Path,
    prefix: str,
    prev_end: float | None = None,
    next_start: float | None = None,
    audio_segment: AudioSegment | None = None,
) -> Tuple[str, Path]:
    """Slice a portion of the audio that contains the spoken word.

    Adds a small pre/post padding window so clipped words are easier to hear,
    then applies conservative peak normalization to reduce "muffled" playback.
    """
    audio = audio_segment or AudioSegment.from_file(audio_path)
    start_ms_raw = int(start * 1000)
    end_ms_raw = int(end * 1000)

    pre_pad = PRE_PAD_MS
    if prev_end is not None:
        gap_prev = max(0, start_ms_raw - int(prev_end * 1000))
        pre_pad = min(pre_pad, max(0, gap_prev // 2))

    post_pad = POST_PAD_MS
    if next_start is not None:
        gap_next = max(0, int(next_start * 1000) - end_ms_raw)
        post_pad = min(post_pad, max(0, gap_next // 2))

    start_ms = max(0, start_ms_raw - pre_pad)
    end_ms = min(len(audio), end_ms_raw + post_pad)
    if end_ms - start_ms < MIN_CLIP_MS:
        end_ms = min(len(audio), start_ms + MIN_CLIP_MS)
    snippet = audio[start_ms:end_ms]

    peak = snippet.max_dBFS
    if peak != float("-inf"):
        gain = min(MAX_GAIN_DB, TARGET_PEAK_DBFS - peak)
        if gain > 0.0:
            snippet = snippet.apply_gain(gain)
    snippet = snippet.fade_in(5).fade_out(15)
    clip_id = f"{prefix}_{uuid.uuid4().hex}"
    out_path = clips_dir / f"{clip_id}.wav"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    snippet.export(out_path, format="wav")
    return clip_id, out_path
