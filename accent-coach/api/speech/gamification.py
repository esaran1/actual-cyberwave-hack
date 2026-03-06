"""Gamification: XP, badges, streaks, milestones."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

# Badge definitions: (id, name, description, condition)
BADGES = [
    ("first_session", "First Steps", "Complete your first practice session", lambda d: d.get("sessions_completed", 0) >= 1),
    ("pronunciation_80", "Clear Speaker", "Score 80+ on pronunciation", lambda d: d.get("pronunciation_80_count", 0) >= 1),
    ("pronunciation_90", "Clarity Champion", "Score 90+ on pronunciation", lambda d: d.get("pronunciation_90_count", 0) >= 1),
    ("interview_70", "Interview Ready", "Score 70+ on an interview", lambda d: d.get("interview_70_count", 0) >= 1),
    ("customer_care_70", "Customer Pro", "Score 70+ on customer care", lambda d: d.get("customer_care_70_count", 0) >= 1),
    ("streak_3", "On a Roll", "Practice 3 days in a row", lambda d: d.get("current_streak", 0) >= 3),
    ("streak_7", "Week Warrior", "Practice 7 days in a row", lambda d: d.get("current_streak", 0) >= 7),
    ("sessions_5", "Getting Started", "Complete 5 sessions", lambda d: d.get("sessions_completed", 0) >= 5),
    ("sessions_10", "Dedicated", "Complete 10 sessions", lambda d: d.get("sessions_completed", 0) >= 10),
    ("multi_module", "Versatile", "Use 3+ modules (Record, Interview, Customer Care, etc.)", lambda d: len(set(d.get("modules_used") or [])) >= 3),
]

XP_PER_SESSION = 10
XP_PER_SCORE_POINT = 1  # e.g. score 85 = +85 XP
XP_STREAK_BONUS = 5  # per day of streak


def compute_total_xp(stats: Dict[str, Any], scores_map: Dict[str, List[int]]) -> int:
    """Compute total XP from stats and scores for display."""
    total = 0
    for mod, scores in scores_map.items():
        for s in scores:
            total += compute_xp(mod, int(s), is_new_session=True)
    return total


def compute_xp(
    module: str,
    score: int,
    is_new_session: bool = True,
) -> int:
    """Compute XP earned for a session."""
    xp = 0
    if is_new_session:
        xp += XP_PER_SESSION
    xp += min(100, score) * (XP_PER_SCORE_POINT / 10)
    return max(0, int(xp))


def compute_streak(last_activity_dates: List[str]) -> int:
    """Compute current streak from list of ISO date strings (YYYY-MM-DD)."""
    if not last_activity_dates:
        return 0
    dates = sorted(set(d[:10] for d in last_activity_dates), reverse=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if not dates or dates[0] != today and dates[0] != (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d"):
        # Streak broken if most recent isn't today or yesterday
        check_date = datetime.now(timezone.utc).date()
        most_recent = datetime.fromisoformat(dates[0] + "T00:00:00Z").replace(tzinfo=timezone.utc).date()
        if (check_date - most_recent).days > 1:
            return 0
    streak = 0
    prev = None
    for d in dates:
        dt = datetime.fromisoformat(d + "T00:00:00Z").replace(tzinfo=timezone.utc).date()
        if prev is None:
            prev = dt
            streak = 1
        else:
            diff = (prev - dt).days
            if diff == 1:
                streak += 1
                prev = dt
            else:
                break
    return streak


def get_earned_badges(stats: Dict[str, Any]) -> List[Dict[str, str]]:
    """Return list of earned badges based on stats."""
    earned = []
    for bid, name, desc, condition in BADGES:
        if condition(stats):
            earned.append({"id": bid, "name": name, "description": desc})
    return earned


def get_suggested_drill(stats: Dict[str, Any], scores: Dict[str, List[int]]) -> Optional[str]:
    """Suggest next practice module based on weak areas."""
    suggestions = []
    avg_pron = sum(scores.get("pronunciation", [0])) / max(1, len(scores.get("pronunciation", [])))
    avg_interview = sum(scores.get("interview", [0])) / max(1, len(scores.get("interview", [])))
    avg_customer = sum(scores.get("customer_care", [0])) / max(1, len(scores.get("customer_care", [])))
    modules = set(stats.get("modules_used") or [])

    if avg_pron < 75 and "pronunciation" not in modules:
        suggestions.append(("record", "Pronunciation practice", "Improve clarity with word-level feedback"))
    if avg_pron < 75:
        suggestions.append(("record", "Record & get feedback", "Build clarity"))
    if avg_interview < 70:
        suggestions.append(("interview", "Interview practice", "Prepare for job interviews"))
    if avg_customer < 70:
        suggestions.append(("customer-care", "Customer care drills", "Handle tough customer situations"))
    if not modules or len(modules) < 2:
        suggestions.append(("customer-care", "Try customer care", "Practice industry scenarios"))
    return suggestions[0][0] if suggestions else "record"
