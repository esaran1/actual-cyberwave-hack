"""Speech and confidence coaching: pacing, filler words, pauses, tone analysis."""

from __future__ import annotations

import re
from typing import Dict, List, Optional

# Common filler words in English
FILLER_WORDS = frozenset({
    "um", "uh", "er", "ah", "like", "you know", "basically",
    "actually", "literally", "so", "well", "right", "anyway",
    "i mean", "kind of", "sort of", "just", "really",
})
FILLER_PATTERNS = [
    r"\b(um|uh|er|ah)\b",
    r"\b(like)\b",
    r"\b(you know)\b",
    r"\b(basically|actually|literally)\b",
    r"\b(well|so)\s*,?\s*(um|uh)?\b",
    r"\b(i mean)\b",
    r"\b(kind of|sort of)\b",
]


def analyze_pacing(
    words: List[Dict],
    duration_seconds: Optional[float] = None,
) -> Dict:
    """Compute pacing metrics: words per minute, pauses, speed label."""
    if not words:
        return {
            "words_per_minute": 0,
            "label": "unknown",
            "pauses": [],
            "long_pauses_count": 0,
            "pause_ratio": 0.0,
            "feedback": [],
        }

    total_duration = duration_seconds
    if total_duration is None:
        last_end = words[-1].get("end", 0.0) if words else 0.0
        first_start = words[0].get("start", 0.0) if words else 0.0
        total_duration = max(0.1, last_end - first_start)

    word_count = len(words)
    wpm = round((word_count / total_duration) * 60) if total_duration > 0 else 0

    # Detect pauses (gaps between words > 0.3s)
    pauses: List[Dict] = []
    long_pauses = 0
    speech_duration = 0.0
    pause_duration = 0.0
    prev_end = None
    for w in words:
        start = float(w.get("start", 0.0))
        end = float(w.get("end", start + 0.2))
        if prev_end is not None and start > prev_end + 0.3:
            gap = start - prev_end
            pause_duration += gap
            pauses.append({"start": prev_end, "end": start, "duration": gap})
            if gap >= 1.0:
                long_pauses += 1
        speech_duration += end - start
        prev_end = end

    total = speech_duration + pause_duration
    pause_ratio = round(pause_duration / total, 2) if total > 0 else 0.0

    # Label
    if wpm < 100:
        label = "slow"
    elif wpm <= 160:
        label = "balanced"
    else:
        label = "fast"

    feedback = []
    if label == "fast":
        feedback.append("Slow down slightly—pausing between key points improves clarity.")
    elif label == "slow":
        feedback.append("You could pick up the pace to maintain engagement.")
    if long_pauses >= 2:
        feedback.append("Long pauses are okay for emphasis; avoid too many in the middle of ideas.")
    if pause_ratio > 0.4:
        feedback.append("High pause ratio—consider tightening your delivery for workplace contexts.")

    return {
        "words_per_minute": wpm,
        "label": label,
        "pauses": pauses[:10],
        "long_pauses_count": long_pauses,
        "pause_ratio": pause_ratio,
        "feedback": feedback[:3],
    }


def detect_filler_words(text: str) -> List[Dict]:
    """Find filler words in transcript. Returns list of {word, start_index, count}."""
    text_lower = text.lower().strip()
    found: List[Dict] = []
    seen: Dict[str, int] = {}

    for pattern in FILLER_PATTERNS:
        for m in re.finditer(pattern, text_lower, re.IGNORECASE):
            word = m.group(1).lower() if m.lastindex else m.group(0).lower()
            if word in FILLER_WORDS or any(f in word for f in ("um", "uh", "like", "you know")):
                key = f"{word}_{m.start()}"
                if key not in seen:
                    seen[key] = len(found)
                    found.append({"word": word, "count": 1})
                else:
                    found[seen[key]]["count"] += 1

    # Simple word-level scan for um, uh, like
    tokens = re.findall(r"\b\w+\b", text_lower)
    for i, tok in enumerate(tokens):
        if tok in ("um", "uh", "er", "ah"):
            key = f"{tok}_{i}"
            if key not in seen:
                seen[key] = len(found)
                found.append({"word": tok, "count": 1})

    return found


def analyze_speech_confidence(
    transcript_text: str,
    words: Optional[List[Dict]] = None,
    pacing: Optional[Dict] = None,
) -> Dict:
    """Analyze tone, filler words, pauses for confidence feedback."""
    fillers = detect_filler_words(transcript_text)
    filler_count = sum(f.get("count", 1) for f in fillers)
    word_count = len(transcript_text.split()) or 1
    filler_rate = round(filler_count / word_count, 2)

    pacing_data = pacing or (analyze_pacing(words or []) if words else {})

    confidence_score = 100
    feedback: List[str] = []

    if filler_rate > 0.05:
        confidence_score -= min(20, int(filler_rate * 200))
        feedback.append("Reduce filler words (um, uh, like)—pause briefly instead for a more confident sound.")
    if filler_count > 3:
        feedback.append("Replace fillers with short pauses. Breathe, then continue.")

    if pacing_data.get("label") == "fast":
        confidence_score -= 5
    elif pacing_data.get("label") == "slow" and pacing_data.get("words_per_minute", 150) < 90:
        feedback.append("Slightly faster delivery can convey more confidence.")

    if pacing_data.get("long_pauses_count", 0) >= 3:
        feedback.append("Strategic pauses work—limit long hesitations mid-sentence.")

    confidence_score = max(1, min(100, confidence_score))

    return {
        "confidence_score": confidence_score,
        "filler_count": filler_count,
        "filler_rate": filler_rate,
        "filler_words": fillers[:5],
        "pacing_label": pacing_data.get("label", "unknown"),
        "words_per_minute": pacing_data.get("words_per_minute"),
        "feedback": feedback[:4],
    }
