from __future__ import annotations

import os
from pathlib import Path
from threading import Lock
from typing import Dict, List, Union

from faster_whisper import WhisperModel

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

_MODEL: WhisperModel | None = None
_MODEL_LOCK = Lock()


def _get_model() -> WhisperModel:
    global _MODEL
    with _MODEL_LOCK:
        if _MODEL is None:
            _MODEL = WhisperModel(
                WHISPER_MODEL,
                device="cpu",
                compute_type=WHISPER_COMPUTE_TYPE,
            )
    return _MODEL


def _clamp_confidence(value: float | None) -> float:
    if value is None:
        return 0.0
    return max(0.0, min(1.0, float(value)))


def transcribe(audio_path: Union[str, Path]) -> Dict:
    """Run faster-whisper inference and return per-word timings."""
    model = _get_model()
    segments, info = model.transcribe(str(audio_path), word_timestamps=True)
    words: List[Dict] = []
    segment_payload: List[Dict] = []
    fallback_segments = []
    for segment in segments:
        fallback_segments.append(segment)
        segment_payload.append(
            {
                "text": getattr(segment, "text", "").strip(),
                "start": float(getattr(segment, "start", 0.0)),
                "end": float(getattr(segment, "end", 0.0)),
            }
        )
        if getattr(segment, "words", None):
            for word in segment.words:
                token = word.word.strip()
                if not token:
                    continue
                words.append(
                    {
                        "word": token,
                        "start": float(word.start or segment.start),
                        "end": float(word.end or segment.end),
                        "confidence": _clamp_confidence(getattr(word, "probability", None)),
                    }
                )
    if not words:
        words = _approximate_alignment(fallback_segments)
    transcript_text = " ".join([w["word"] for w in words])
    return {
        "language": getattr(info, "language", "en"),
        "words": words,
        "segments": segment_payload,
        "text": transcript_text.strip(),
    }


def _approximate_alignment(segments) -> List[Dict]:
    """Fallback when Whisper does not return per-word timings."""
    approx_words: List[Dict] = []
    for segment in segments:
        text = getattr(segment, "text", "")
        tokens = text.strip().split()
        if not tokens:
            continue
        seg_start = float(getattr(segment, "start", 0.0))
        seg_end = float(getattr(segment, "end", seg_start + 0.5))
        duration = max(seg_end - seg_start, 1e-3)
        slice_duration = duration / len(tokens)
        for idx, token in enumerate(tokens):
            start = seg_start + idx * slice_duration
            approx_words.append(
                {
                    "word": token,
                    "start": start,
                    "end": start + slice_duration,
                    "confidence": 0.4,
                }
            )
    return approx_words
