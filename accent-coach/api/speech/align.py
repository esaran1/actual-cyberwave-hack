from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional

try:  # pragma: no cover - optional dependency
    import whisperx
except Exception:  # pragma: no cover - allow running without whisperx
    whisperx = None  # type: ignore


def align_words(audio_path: Path, segments: List[Dict], language: str = "en") -> Optional[List[Dict]]:
    """Align transcript segments to audio and return word-level alignments.

    Returns None if whisperx is unavailable or alignment fails.
    """
    if whisperx is None:
        return None

    try:
        # Prefer a stronger English alignment model when available, but fall back safely.
        if language == "en":
            try:
                align_model, metadata = whisperx.load_align_model(
                    language_code=language,
                    device="cpu",
                    model_name="WAV2VEC2_ASR_LARGE_LV60K_960H",
                )
            except Exception:
                align_model, metadata = whisperx.load_align_model(language_code=language, device="cpu")
        else:
            align_model, metadata = whisperx.load_align_model(language_code=language, device="cpu")
        result = whisperx.align(segments, align_model, metadata, str(audio_path), device="cpu")
    except Exception:
        return None

    return result.get("word_segments") or None
