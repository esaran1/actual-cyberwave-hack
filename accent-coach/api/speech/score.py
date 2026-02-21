from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Callable, Dict, List

from speech.phonemes import (
    get_expected_phonemes,
    has_r_l_mix,
    has_th_sound,
    has_v_w_mix,
    has_vowel_length,
)

DEFAULT_TIP = "Take a breath, slow down, and match the rhythm of a native speaker."


@dataclass
class IssueRule:
    label: str
    pattern: str | None = None
    tip: str = DEFAULT_TIP
    penalty: int = 10
    matcher: Callable[[str], bool] | None = None

    def matches(self, token: str) -> bool:
        if self.matcher:
            return self.matcher(token)
        if not self.pattern:
            return False
        return bool(re.search(self.pattern, token))


RULES = [
    IssueRule(
        label="th_sound",
        pattern=r"th",
        tip="Place your tongue lightly between your teeth for TH sounds and add a soft airflow.",
        penalty=15,
    ),
    IssueRule(
        label="r_l",
        pattern=r"[rl]",
        tip="Keep /r/ curled slightly and /l/ with the tongue touching the ridge just behind the teeth.",
        penalty=12,
        matcher=lambda token: "r" in token and "l" in token,
    ),
    IssueRule(
        label="v_w",
        pattern=r"[vw]",
        tip="For /v/ bite your lower lip gently; for /w/ round the lips more and avoid lip contact.",
        penalty=12,
        matcher=lambda token: token.startswith("v") or token.startswith("w"),
    ),
    IssueRule(
        label="vowel_length",
        pattern=r"aa|ee|oo|ai|ea|ie",
        tip="Stretch long vowels for a full beat; short vowels should be crisp and quick.",
        penalty=10,
    ),
    IssueRule(
        label="stress",
        tip="Give the stressed syllable extra volume and length to keep the natural English pattern.",
        penalty=10,
        matcher=lambda token: _estimate_syllables(token) >= 3,
    ),
]

LOW_CONFIDENCE_TIP = "Try recording a little closer to the mic and pronounce each word clearly."


def score_word(word: Dict) -> Dict:
    token = word.get("word", "").lower()
    clean = re.sub(r"[^a-z]", "", token)
    confidence = float(word.get("confidence", 0.0))
    alignment_score = word.get("alignment_score")
    start = float(word.get("start") or 0.0)
    end = float(word.get("end") or (start + 0.4))
    issue_label = None
    tip = DEFAULT_TIP

    phoneme_data = get_expected_phonemes(clean)
    phonemes = phoneme_data.get("phonemes", [])
    observed_phonemes = word.get("observed_phonemes", []) or []

    issue_label, tip = _issue_from_phonemes(phonemes, clean)

    low_signal = confidence < 0.55 or (alignment_score is not None and alignment_score < 0.55)
    if low_signal and issue_label == "ok":
        issue_label = "low_confidence"
        tip = LOW_CONFIDENCE_TIP

    phoneme_score, phoneme_issue = _compute_phoneme_score(phonemes, observed_phonemes)
    if phoneme_issue != "ok":
        issue_label = phoneme_issue
        tip = _tip_for_issue(issue_label)

    score_value = _compute_accuracy(confidence, alignment_score, phoneme_score)

    return {
        "word": word.get("word", ""),
        "start": start,
        "end": end,
        "confidence": round(confidence, 3),
        "alignment_score": round(float(alignment_score), 3) if alignment_score is not None else None,
        "expected_phonemes": phonemes,
        "observed_phonemes": observed_phonemes,
        "score": score_value,
        "issue": issue_label or "ok",
        "tip": tip,
    }


def _compute_accuracy(confidence: float, alignment_score: float | None, phoneme_score: float | None) -> int:
    if alignment_score is not None:
        align = max(0.0, min(1.0, float(alignment_score)))
        conf = max(0.0, min(1.0, float(confidence)))
        blended = (0.5 * align) + (0.2 * conf)
        if phoneme_score is not None:
            blended = blended + (0.3 * phoneme_score)
        return max(1, min(100, int(round(blended * 100))))
    if phoneme_score is not None:
        return max(1, min(100, int(round(phoneme_score * 100))))
    return max(20, int(round(80 + confidence * 20)))


def _compute_phoneme_score(expected: List[str], observed: List[str]) -> tuple[float | None, str]:
    if not expected or not observed:
        return None, "ok"
    distance, subs = _phoneme_distance(expected, observed)
    error_rate = distance / max(1, len(expected))
    score = max(0.0, min(1.0, 1.0 - error_rate))
    issue = _issue_from_subs(subs)
    return score, issue


def _phoneme_distance(expected: List[str], observed: List[str]) -> tuple[int, List[tuple[str, str]]]:
    rows = len(expected) + 1
    cols = len(observed) + 1
    dp = [[0] * cols for _ in range(rows)]
    for i in range(rows):
        dp[i][0] = i
    for j in range(cols):
        dp[0][j] = j
    subs: List[tuple[str, str]] = []
    for i in range(1, rows):
        for j in range(1, cols):
            cost = 0 if expected[i - 1] == observed[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
    # Backtrace to collect substitutions
    i, j = len(expected), len(observed)
    while i > 0 and j > 0:
        current = dp[i][j]
        if expected[i - 1] == observed[j - 1]:
            i -= 1
            j -= 1
        elif current == dp[i - 1][j - 1] + 1:
            subs.append((expected[i - 1], observed[j - 1]))
            i -= 1
            j -= 1
        elif current == dp[i - 1][j] + 1:
            i -= 1
        else:
            j -= 1
    return dp[-1][-1], subs


def _issue_from_subs(subs: List[tuple[str, str]]) -> str:
    for expected, observed in subs:
        if expected in {"TH", "DH"} and observed in {"S", "T", "D", "F"}:
            return "th_sound"
        if expected == "R" and observed == "L":
            return "r_l"
        if expected == "L" and observed == "R":
            return "r_l"
        if expected == "V" and observed == "W":
            return "v_w"
        if expected == "W" and observed == "V":
            return "v_w"
    return "ok"


def _tip_for_issue(issue: str) -> str:
    for rule in RULES:
        if rule.label == issue:
            return rule.tip
    return DEFAULT_TIP


def _issue_from_phonemes(phonemes: List[str], clean: str) -> tuple[str, str]:
    if phonemes:
        if has_th_sound(phonemes):
            return "th_sound", RULES[0].tip
        if has_r_l_mix(phonemes):
            return "r_l", RULES[1].tip
        if has_v_w_mix(phonemes):
            return "v_w", RULES[2].tip
        if has_vowel_length(phonemes):
            return "vowel_length", RULES[3].tip
        if _estimate_syllables(clean) >= 3:
            return "stress", RULES[4].tip
    for rule in RULES:
        if clean and rule.matches(clean):
            return rule.label, rule.tip
    return "ok", DEFAULT_TIP


def _estimate_syllables(token: str) -> int:
    chunks = re.findall(r"[aeiouy]+", token)
    return max(1, len(chunks))
