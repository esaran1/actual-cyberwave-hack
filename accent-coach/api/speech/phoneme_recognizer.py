from __future__ import annotations

from pathlib import Path
from typing import List

try:  # pragma: no cover - optional dependency
    from allosaurus.app import read_recognizer
except Exception:  # pragma: no cover
    read_recognizer = None  # type: ignore

_RECOGNIZER = None


def _get_recognizer():
    global _RECOGNIZER
    if read_recognizer is None:
        return None
    if _RECOGNIZER is None:
        try:
            _RECOGNIZER = read_recognizer("eng2102")
        except Exception:
            return None
    return _RECOGNIZER


def recognize_phonemes(audio_path: Path) -> List[str]:
    recognizer = _get_recognizer()
    if recognizer is None:
        return []
    try:
        result = recognizer.recognize(str(audio_path))
        tokens = [token.strip().upper() for token in result.split() if token.strip()]
        return tokens
    except Exception:
        return []
