from __future__ import annotations

import re
from typing import Dict, List

import pronouncing

VOWEL_PHONEMES = {
    "AA",
    "AE",
    "AH",
    "AO",
    "AW",
    "AY",
    "EH",
    "ER",
    "EY",
    "IH",
    "IY",
    "OW",
    "OY",
    "UH",
    "UW",
}


def get_expected_phonemes(token: str) -> Dict:
    clean = re.sub(r"[^a-z]", "", token.lower())
    if not clean:
        return {"phonemes": [], "stress": []}
    phones = pronouncing.phones_for_word(clean)
    if not phones:
        return {"phonemes": [], "stress": []}
    # Use the first CMU pronunciation
    phoneme_tokens = phones[0].split()
    stress = [phoneme[-1] for phoneme in phoneme_tokens if phoneme[-1].isdigit()]
    stripped = [re.sub(r"\d", "", phoneme) for phoneme in phoneme_tokens]
    return {"phonemes": stripped, "stress": stress}


def has_vowel_length(phonemes: List[str]) -> bool:
    return any(ph in {"IY", "AA", "UW", "AO", "ER"} for ph in phonemes)


def has_th_sound(phonemes: List[str]) -> bool:
    return any(ph in {"TH", "DH"} for ph in phonemes)


def has_r_l_mix(phonemes: List[str]) -> bool:
    return "R" in phonemes and "L" in phonemes


def has_v_w_mix(phonemes: List[str]) -> bool:
    return "V" in phonemes or "W" in phonemes
