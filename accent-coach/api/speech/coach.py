"""Local coaching logic—no external API. Replaces Gemini for script, feedback, questions, and analysis."""

from __future__ import annotations

import re
from typing import List

# Fixed presentation feedback tips
DEFAULT_FEEDBACK = [
    "Speak clearly and at a steady pace.",
    "Use pauses after key points to let ideas sink in.",
    "Structure your content with a clear opening, main points, and closing.",
    "Maintain eye contact with your audience.",
    "Practice your delivery to build confidence.",
]

# Fixed interview improvement tips (used as fallback; get_interview_analysis uses its own list)
DEFAULT_IMPROVEMENTS = [
    "Speak clearly and at a moderate pace.",
    "Use the STAR method: Situation, Task, Action, Result.",
    "Give specific examples from your experience.",
    "Show enthusiasm for the role and company.",
]

# Template interview questions for frontline roles
FRONTLINE_QUESTIONS = [
    "Tell me about a time you worked as part of a team. What was your role?",
    "Describe a situation where you had to deal with a difficult customer or coworker. How did you handle it?",
    "Why are you interested in this role at our company?",
    "What does good customer service mean to you?",
    "Tell me about your relevant experience for this position.",
    "How do you prioritize tasks when you have multiple things to do?",
    "Describe a time you followed safety procedures or protocols. Why was it important?",
]


def _extract_questions_from_text(text: str, max_q: int = 8) -> List[str]:
    """Extract potential audience questions from content by using sentences or bullet points."""
    questions = []
    text = text.strip()
    if not text:
        return []
    # Split into paragraphs
    paras = [p.strip() for p in re.split(r"\n\n+", text) if len(p.strip()) > 20]
    for p in paras[:max_q]:
        # Use first sentence or first 80 chars as basis for a question
        first = p.split(". ")[0].strip()
        if not first.endswith("."):
            first = first + "."
        if len(first) > 15:
            questions.append(f"Can you elaborate on: {first}")
    # If we don't have enough, add generic ones
    generic = [
        "What are the main takeaways from this?",
        "How would you apply this in practice?",
        "What challenges might arise?",
        "Can you give an example?",
    ]
    for g in generic:
        if len(questions) >= max_q:
            break
        if g not in questions:
            questions.append(g)
    return questions[:max_q]


def _content_to_script(content: str, max_len: int = 4000) -> str:
    """Turn content into a simple spoken-word script."""
    text = content.strip()[:max_len]
    if not text:
        return ""
    paras = [p.strip() for p in re.split(r"\n\n+", text) if p.strip()]
    intro = "Hello. Today I'll cover the key points from this content."
    if not paras:
        return intro + " " + text[:500]
    body = " ".join(paras)
    closing = " Those are the main points. Thank you for listening."
    script = intro + " " + body + closing
    return script[:max_len]


def get_audience_questions(transcript: str, slide_texts: List[str]) -> List[str]:
    """Generate questions from presentation content (local, no API)."""
    combined = "\n".join(t for t in slide_texts if t).strip()
    if not combined:
        combined = (transcript or "")[:2000]
    return _extract_questions_from_text(combined, max_q=8)


def _find_answer_in_content(content: str, question: str) -> str:
    """Extract a relevant answer from content based on the question."""
    content = content.strip()
    if not content:
        return ""
    paras = [p.strip() for p in re.split(r"\n\n+", content) if len(p.strip()) > 15]
    if not paras:
        return content[:500]

    # "Can you elaborate on: X" — use the paragraph that contains X (exact substring first)
    if question.startswith("Can you elaborate on:"):
        snippet = question.replace("Can you elaborate on:", "").strip().rstrip(".")
        snippet_lower = snippet.lower()
        for p in paras:
            if snippet_lower in p.lower():
                return p
        # Fallback: paragraph with best keyword overlap (require high overlap to avoid weak matches)
        best = max(paras, key=lambda p: _word_overlap(snippet, p))
        return best if _word_overlap(snippet, best) > 0.5 else paras[0]

    # Generic questions — pick best-matching content
    q_lower = question.lower()
    if "main takeaway" in q_lower or "takeaways" in q_lower:
        points = [p.split(". ")[0] + "." for p in paras[:5] if "." in p]
        return " ".join(points) if points else paras[0]
    if "apply" in q_lower or "practice" in q_lower:
        for p in paras:
            if any(w in p.lower() for w in ["apply", "use", "practice", "implement", "when"]):
                return p
        return paras[-1] if len(paras) > 1 else paras[0]
    if "challenge" in q_lower:
        for p in paras:
            if any(w in p.lower() for w in ["challenge", "risk", "difficult", "problem", "obstacle"]):
                return p
        return paras[0]
    if "example" in q_lower:
        for p in paras:
            if any(w in p.lower() for w in ["for example", "such as", "e.g", "instance", "like when"]):
                return p
        return paras[1] if len(paras) > 1 else paras[0]

    # Default: best paragraph by keyword overlap with question
    q_words = set(re.findall(r"\b\w{3,}\b", question.lower())) - {"can", "you", "the", "what", "how", "are", "from", "this", "and", "for"}
    if not q_words:
        return paras[0]
    best = max(paras, key=lambda p: _word_overlap_set(q_words, p))
    return best


def _word_overlap(a: str, b: str) -> float:
    """Return overlap ratio: shared words / total unique words in a."""
    wa = set(re.findall(r"\b\w{3,}\b", a.lower())) - {"the", "and", "for", "can", "you"}
    wb = set(re.findall(r"\b\w{3,}\b", b.lower()))
    if not wa:
        return 0.0
    return len(wa & wb) / len(wa)


def _word_overlap_set(wa: set, b: str) -> int:
    """Count matching words between set and string."""
    wb = set(re.findall(r"\b\w{3,}\b", b.lower()))
    return len(wa & wb)


def get_answers_for_questions(
    transcript: str, slide_texts: List[str], questions: List[str]
) -> List[dict[str, str]]:
    """Return content-based answers for each question (local, no API)."""
    content = "\n".join(t for t in slide_texts if t) or (transcript or "")[:3000]
    out = []
    for q in questions[:8]:
        ans = _find_answer_in_content(content, q)
        if not ans:
            ans = content[:400] if content else "See the presentation content for details."
        out.append({"question": q, "answer": ans})
    return out


def get_text_script_feedback_questions(content: str) -> dict:
    """Generate script, feedback, and questions from text (local, no API)."""
    if not content or not content.strip():
        return {}
    text = content[:8000].strip()
    script = _content_to_script(text)
    feedback = list(DEFAULT_FEEDBACK)[:5]
    questions = _extract_questions_from_text(text, max_q=8)
    return {"script": script, "feedback": feedback, "questions": questions}


def get_answers_for_text(content: str, questions: List[str]) -> List[dict[str, str]]:
    """Return content-based answers for each question (local, no API)."""
    text = (content or "").strip()[:6000]
    out = []
    for q in questions[:8]:
        ans = _find_answer_in_content(text, q)
        if not ans:
            ans = text[:400] if text else "Refer to the document for details."
        out.append({"question": q, "answer": ans})
    return out


def get_interview_questions(
    company_name: str,
    job_position: str,
    company_mission: str,
    qualifications: str,
) -> List[str]:
    """Return template interview questions for frontline roles (no API)."""
    custom = []
    if company_name:
        custom.append(f"Why do you want to work at {company_name}?")
    if job_position:
        custom.append(f"What experience do you have that relates to {job_position}?")
    return (custom + FRONTLINE_QUESTIONS)[:7]


def _content_score(questions: List[str], transcripts: List[str], qualifications: str) -> tuple[float, float, float]:
    """Return (completion, relevance, resume_alignment) scores 0-1. No time/length factors."""
    num_q = max(1, len(questions))
    # Completion: did they provide some content for each question?
    answered = sum(1 for t in transcripts if t and len(t.strip()) > 5)
    completion = answered / num_q
    quals_lower = qualifications.lower()
    quals_words = set(re.findall(r"\b\w{3,}\b", quals_lower)) - {"the", "and", "for", "you", "your"}
    total_relevance = 0.0
    total_resume = 0.0
    for q, t in zip(questions, transcripts):
        if not t or len(t.strip()) < 5:
            total_relevance += 0
            total_resume += 0
            continue
        t_lower = t.lower()
        q_words = set(re.findall(r"\b\w{3,}\b", q.lower())) - {"the", "and", "for", "you", "your", "tell", "describe", "what", "how", "why"}
        t_words = set(re.findall(r"\b\w{3,}\b", t_lower))
        relevance = len(q_words & t_words) / max(1, len(q_words)) if q_words else 0.5
        resume_match = len(quals_words & t_words) / max(1, min(50, len(quals_words))) if quals_words else 0
        total_relevance += min(1.0, relevance)
        total_resume += min(1.0, resume_match * 3)
    avg_relevance = total_relevance / num_q
    avg_resume = total_resume / num_q
    return completion, avg_relevance, avg_resume


def get_interview_analysis(
    questions: List[str],
    transcripts: List[str],
    company_name: str,
    job_position: str,
    qualifications: str,
) -> dict:
    """Analyze interview by content and resume fit only. No time or length factors."""
    completion, relevance, resume_align = _content_score(questions, transcripts, qualifications)
    score = int(completion * 30 + relevance * 35 + resume_align * 35)
    score = max(1, min(100, score))
    if score >= 70:
        summary = "Your answers were relevant and drew well from your background. Strong content overall."
    elif score >= 50:
        summary = "You addressed the questions. Try to connect your answers more directly to your resume and experience."
    else:
        summary = "Answers could be more specific. Use examples from your resume and tie your experience to each question."
    improvements = [
        "Connect answers to your resume—mention specific roles, projects, or skills.",
        "Use the STAR method: Situation, Task, Action, Result.",
        "Give concrete examples from your experience.",
        "Tailor each answer to show relevance to the role.",
        "Show enthusiasm for the company and position.",
    ]
    if relevance < 0.3:
        improvements.insert(0, "Answer the question asked—use keywords from the question in your response.")
    if resume_align < 0.2 and qualifications:
        improvements.insert(0, "Draw from your qualifications—reference your experience, skills, and achievements.")
    return {"summary": summary, "score": score, "improvements": improvements[:6]}


def get_gemini_tips(
    transcript: str,
    slide_texts: List[str],
    pacing_label: str,
    slides_per_minute: float | None,
    duration_seconds: float | None,
) -> List[str]:
    """Return presentation tips based on pacing metrics (local, no API)."""
    tips = list(DEFAULT_FEEDBACK)[:4]
    if pacing_label and "fast" in pacing_label.lower():
        tips.insert(0, "Slow down—try pausing between key points.")
    elif pacing_label and "slow" in pacing_label.lower():
        tips.insert(0, "You could pick up the pace slightly to maintain energy.")
    if slides_per_minute is not None:
        if slides_per_minute > 3:
            tips.insert(0, "Spend more time on each slide—let the audience absorb the content.")
        elif slides_per_minute < 0.5:
            tips.insert(0, "Consider moving through slides a bit faster to keep engagement.")
    return tips[:6]
