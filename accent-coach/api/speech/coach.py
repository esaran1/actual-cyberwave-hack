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


# Customer Care: 7 frontline categories, 3 scenarios each
CUSTOMER_CARE_CATEGORIES = [
    "Healthcare",
    "Construction",
    "Retail",
    "Food Service",
    "Hospitality",
    "Transportation",
    "Banking & Finance",
]

# Scenarios: each has context (situation + your constraint) and customer_lines (what customer says)
CUSTOMER_CARE_SCENARIOS: dict[str, list[dict]] = {
    "Healthcare": [
        {
            "context": "A patient has been waiting 90 minutes past their appointment time. The clinic is running behind because of emergencies. You cannot bump them ahead of others who have been waiting—you must acknowledge their frustration while explaining the delay and offering to reschedule or wait.",
            "customer_lines": [
                "This is ridiculous! I've been here for an hour and a half. I had a 2 o'clock appointment and it's past 3:30. Do you have any idea how long I've been sitting here?",
                "Reschedule? I already took time off work! Why should I have to come back? Can't you just squeeze me in? Someone has to see me today.",
                "Fine. But if I have to wait another hour I'm filing a complaint. This place is a joke.",
            ],
        },
        {
            "context": "A patient's insurance denied coverage for a medication their doctor prescribed. You cannot override the denial—you must explain they need to contact their insurance or their doctor's office to appeal, and suggest asking about generic alternatives or patient assistance programs.",
            "customer_lines": [
                "My doctor wrote me a prescription and your pharmacy is refusing to fill it. They said my insurance won't pay. I need this medication—what am I supposed to do?",
                "Call my insurance? I've been on hold for an hour already! Can't you just give it to me and bill me later? I'll pay out of pocket if I have to.",
                "So you're telling me I have to jump through hoops while I'm sick? Unbelievable. Fine. What's the number?",
            ],
        },
        {
            "context": "A family member wants to visit a patient outside visiting hours. Hospital policy is strict—visiting hours ended 30 minutes ago. Exceptions require approval from the charge nurse or attending physician. You cannot let them in without that approval.",
            "customer_lines": [
                "I'm here to see my father in room 204. The nurse at the desk said visiting hours are over. I just got off a 12-hour shift—this is the only time I could come. You have to let me in.",
                "Five minutes! I'm asking for five minutes! He's my father. What kind of place doesn't let family see their sick relatives? Get me a supervisor.",
                "This is heartless. I'm not leaving until someone with authority talks to me. Where's the charge nurse?",
            ],
        },
    ],
    "Construction": [
        {
            "context": "Your crew left dirt, debris, and equipment in a customer's yard after a job. Cleanup is scheduled for next week per the contract, but the customer is hosting an event this weekend. You cannot move up the cleanup—the crew is booked. You must apologize and offer alternatives (e.g., they can use their own cleanup, or you can document damage for compensation).",
            "customer_lines": [
                "Your people left my yard looking like a war zone! Dirt everywhere, scraps, equipment—I'm having a party Saturday. When are you sending someone to clean this up?",
                "Next week?! I have 40 people coming in three days! Are you serious? You need to get someone out here tomorrow. I'm not asking, I'm telling you.",
                "This is unacceptable. I'm calling the Better Business Bureau. And I'm not paying the rest of the invoice until my yard is clean.",
            ],
        },
        {
            "context": "Your crew's trucks and materials are blocking the customer's driveway. They have a doctor's appointment in 20 minutes. Moving equipment takes time and requires the foreman's approval. You cannot instantly clear the driveway—you must communicate with the crew and give the customer a realistic timeline.",
            "customer_lines": [
                "Your trucks are blocking my driveway! I have a doctor's appointment in 20 minutes. I need to leave. Now. Get someone to move them!",
                "Ten minutes?! I'll be late! This is a specialist—I waited months for this appointment. Can't you just move one truck? Please!",
                "I'm calling the police if this isn't moved in five minutes. You can't block people's driveways. I'm not kidding.",
            ],
        },
        {
            "context": "A fence your company installed last month is leaning. The customer believes it's faulty work. Company policy requires an inspection before authorizing repair—you cannot promise a free fix until the inspector confirms it's a defect, not damage. You must schedule the inspection and set expectations.",
            "customer_lines": [
                "The fence you installed is already falling over! The posts weren't set deep enough—I can see it. I want it fixed. For free. You messed this up.",
                "An inspection? I'm looking at it right now—it's obviously wrong! Why do I have to wait for someone to come look at what's clearly your mistake? Just send a crew.",
                "If you're not going to fix it, I want a full refund. And I'll post photos everywhere. You think I'm going to pay for this garbage?",
            ],
        },
    ],
    "Retail": [
        {
            "context": "A customer is trying to return prepared food (a sandwich and drink) because they didn't like the taste. Company policy does not allow refunds on food once it has been prepared or consumed—only unopened packaged items can be returned. You must politely explain this policy and offer alternatives (e.g., exchange for a different item, speak to a manager).",
            "customer_lines": [
                "I bought this sandwich and it's terrible. I took one bite. I want my money back. I'm not eating this.",
                "No refunds on food? That's insane! I didn't eat it—I took one bite! So I'm just out ten dollars because you made a bad sandwich?",
                "I want to talk to your manager. This is theft. You're basically stealing from me. Get me someone who can actually help.",
            ],
        },
        {
            "context": "A customer wants an item the website says is in stock, but your system shows zero and you've checked the floor—it's not there. The website inventory updates with a delay. You cannot give them the item. You must explain the discrepancy and offer to check other stores, order online, or notify them when it's restocked.",
            "customer_lines": [
                "Your website says you have three of these in stock. I drove 20 minutes to get here. Where are they?",
                "So the website is wrong? That's false advertising! I need this today—it's for my kid's project. Can't you check in the back or something?",
                "This is the third time I've come to this store for something that's supposedly in stock. You people are useless. I'm never shopping here again.",
            ],
        },
        {
            "context": "A customer claims someone cut in front of them in line. You didn't see it happen. There's no way to verify or enforce line order after the fact. You cannot give them any special treatment (discount, priority) without a manager. You must acknowledge their frustration and offer to get a manager if they'd like to discuss it.",
            "customer_lines": [
                "Someone just cut in front of me! I've been standing here 15 minutes. Are you going to do something about it or what?",
                "You didn't see it? You're standing right there! So I'm just supposed to accept that some rude person gets served before me? I want a discount. Or I want to go next.",
                "Forget it. I'm leaving. And I'm going to leave a review about how you let people cut in line. Enjoy that.",
            ],
        },
    ],
    "Food Service": [
        {
            "context": "A customer found a hair in their food and is demanding a free replacement and refund. Policy allows a replacement but management must approve comping the entire meal. You can offer a new order immediately, but you cannot promise a full refund without a manager—you must get one if they insist.",
            "customer_lines": [
                "There's a hair in my food! Look at it! This is disgusting. I want a new order and I am not paying for this. Not a cent.",
                "A replacement? I'm supposed to eat here after that? I want my money back. All of it. And I want to know what you're going to do about the person who made this.",
                "Get me your manager. Right now. I'm not leaving until someone who can actually do something talks to me. This is a health code violation.",
            ],
        },
        {
            "context": "A customer's order has been delayed 45 minutes. The kitchen is backed up and understaffed. You cannot make food appear faster—you must apologize, check on the order, and offer options: wait, cancel for a refund, or get a comp item. You cannot promise a specific wait time.",
            "customer_lines": [
                "I ordered 45 minutes ago. Forty-five minutes! Where is my food? I'm about to walk out and I'm not paying for anything.",
                "The kitchen is backed up? That's not my problem! I have a meeting in 20 minutes. Either my food is here in 5 or I'm leaving and reporting this to corporate.",
                "This is the worst service I've ever had. I want a full refund and I want it now. And I'm never coming back. Unbelievable.",
            ],
        },
        {
            "context": "A customer has a severe nut allergy and is asking about fryer oil. You must check with the kitchen—you cannot guess. Policy requires a manager or chef to confirm allergen info. If there's any risk of cross-contamination, you must advise them not to order the fries.",
            "customer_lines": [
                "I have a severe nut allergy. Life-threatening. Are the fries cooked in the same oil as anything with nuts? I need to know right now.",
                "You don't know? How do you not know? I could die if I eat the wrong thing! Go ask. Now. I'm not ordering until I get a real answer.",
                "You're not sure? That's not good enough! I've had reactions before from places that 'weren't sure.' I want to speak to whoever actually cooks the food. This is unacceptable.",
            ],
        },
    ],
    "Hospitality": [
        {
            "context": "A guest claims they were promised late checkout but housekeeping is at their door at 10am (standard checkout is 11am). Your system doesn't show a late checkout request. You cannot extend without manager approval, and the next guest is checking in at 2pm—you must verify their request and see what's possible.",
            "customer_lines": [
                "I specifically asked for late checkout when I booked! The person at the front desk said yes. Now housekeeping is banging on my door at 10am. What is going on?",
                "It's not in the system? So you're calling me a liar? I need until noon at least. I have an important video call for work. I can't do it in the lobby.",
                "This is the last time I stay here. I want to speak to a manager. And I want a discount on my bill. I was promised late checkout and you're throwing me out.",
            ],
        },
        {
            "context": "A guest complained about noise from the room next door until 2am. They want a room change and a partial refund. Room changes depend on availability. Refunds require manager approval. You cannot promise either—you must check availability and escalate the refund request.",
            "customer_lines": [
                "The room next to me was blasting music and having a party until 2am. I didn't sleep at all. I have a presentation in four hours. I want a different room and I want money back for last night.",
                "You're not sure if you have rooms? Look! I'm exhausted. I paid for a quiet night and got a nightclub. Either move me or refund the whole stay. I'm not paying for that.",
                "I want a manager. And I want it in writing that I'm getting a refund. This is ridiculous. I'm never staying at this hotel again.",
            ],
        },
        {
            "context": "A guest left their laptop charger in the room and has already checked out. They're at the airport. Your lost-and-found process requires items to be logged and shipped—you cannot promise same-day shipping. Shipping costs are typically charged to the guest. You must explain the process and timeline.",
            "customer_lines": [
                "I left my laptop charger in my room. I just realized at the airport. I'm flying to Seattle. Can you ship it to me? I need it by Friday for work.",
                "You need to verify it's in the room? I know I left it—it was in the outlet by the bed! I'm boarding in an hour. Can you just send it? I'll pay for shipping.",
                "Three to five business days? I need it Friday! Can't you overnight it? I'll pay whatever. This is my work laptop—I can't do my job without it. Please.",
            ],
        },
    ],
    "Transportation": [
        {
            "context": "A passenger's bag didn't arrive on the carousel. The tag shows it was loaded. You must file a trace report—you cannot locate the bag yourself. Bag trace typically takes 24–72 hours. You cannot promise when it will be found or delivered. You must collect their info and explain the process.",
            "customer_lines": [
                "My bag didn't come out! The tag says it was loaded on the flight. Where is it? I have a business meeting tomorrow—all my clothes and materials are in there!",
                "File a trace? I need my bag tonight! Can't you call someone? Check another flight? There has to be something you can do. I can't show up to a client meeting in the clothes I've been wearing for 12 hours!",
                "24 to 72 hours? Are you kidding me? What am I supposed to do until then? I want compensation. And I want to speak to a supervisor. This is unacceptable.",
            ],
        },
        {
            "context": "The bus is 30 minutes late. The customer will miss their connection. You cannot speed up the bus or control traffic. Alternative options (other buses, trains) may be full or have different schedules. You must explain the delay and help them explore options—you cannot guarantee they'll make their connection.",
            "customer_lines": [
                "The bus was supposed to leave at 3:15. It's 3:45. I'm going to miss my connection and I have to be there tonight. What are you going to do about it?",
                "Traffic? So I'm just out of luck? I paid for a ticket! Is there another bus? Another train? I have to get there. I'll pay for a different option. Just get me there.",
                "You're telling me there's nothing? I'm stuck? I'm demanding a full refund. And I want it in writing. This is fraud—you sold me a ticket for a bus that doesn't run on time.",
            ],
        },
        {
            "context": "A customer was charged twice for the same ticket—they see two identical charges on their bank statement. Refunds are processed by the billing department and typically take 5–10 business days. You cannot issue an instant refund—you must submit a refund request and give them a reference number and timeline.",
            "customer_lines": [
                "I was charged twice for my ticket! Look—two charges for $214. I only bought one ticket. I want my money back. Now.",
                "Five to ten business days? I need that money! My rent is due. Can't you just reverse it? You're the one who charged me twice—fix it!",
                "I want a confirmation number. And I want to speak to someone who can actually refund me. If I don't see that money in 48 hours I'm disputing it with my bank and reporting you.",
            ],
        },
    ],
    "Banking & Finance": [
        {
            "context": "A customer's card was declined due to an automated fraud alert. You cannot remove the alert yourself—they must verify their identity (often by calling a separate fraud line or confirming recent transactions). Until then, the card stays blocked. You must explain this and guide them through verification.",
            "customer_lines": [
                "My card was declined at the grocery store! I know I have money—I get paid tomorrow. I had a cart full of food and I was humiliated. What is wrong with your system?",
                "A fraud alert? I didn't authorize anything! I'm standing right here with my ID. Can't you just turn my card back on? I need to buy groceries!",
                "I have to call another number? I've been on hold for 20 minutes already! This is ridiculous. I'm closing my account. You're useless.",
            ],
        },
        {
            "context": "A customer is reporting unauthorized charges. You must verify their identity before discussing account details. You cannot reverse charges yourself—that requires the disputes department. You must take the report, secure the account if needed, and set expectations for the investigation timeline (often 10–90 days).",
            "customer_lines": [
                "I've been on hold for 40 minutes! There are three charges on my account I didn't make. Over $800 total. I need someone to fix this right now. Someone stole my card!",
                "Verify my identity? I'm the one who's been robbed! Just cancel the card and reverse the charges! I need that money back—my mortgage payment is due!",
                "Ten business days? The money is gone now! Can't you just put it back and investigate later? I've been a customer for 10 years. This is how you treat me?",
            ],
        },
        {
            "context": "A customer wired money for a house down payment. The wire is pending—standard processing is 1–3 business days. You cannot speed up an existing wire. Expedited wire options exist but must be requested at the time of sending. You must explain the delay and explore if anything can be done (e.g., contact receiving bank).",
            "customer_lines": [
                "I wired my down payment three days ago. The closing is tomorrow. The title company says they never got it. Where is my money? This is $50,000!",
                "Still processing? How can a wire take three days? I'm going to lose this house! The seller will walk. Can't you expedite it? I'll pay whatever fee.",
                "You're telling me there's nothing you can do? I'm going to miss my closing because of your slow processing? I want to speak to your supervisor. And I want this in writing—if I lose this house, you're liable.",
            ],
        },
    ],
}


def get_customer_care_scenarios(category: str) -> list[dict]:
    """Return the 3 scenarios for a given category."""
    scenarios = CUSTOMER_CARE_SCENARIOS.get(category)
    if not scenarios:
        return []
    return scenarios[:3]


def get_customer_care_feedback(
    category: str,
    transcripts: list[str],
) -> dict:
    """Analyze user replies and return score plus feedback on fulfilling customer needs."""
    empathy_words = {"sorry", "apologize", "understand", "frustrated", "help", "appreciate", "thank", "listen", "hear"}
    action_words = {"check", "find", "fix", "resolve", "address", "escalate", "manager", "refund", "replace", "call"}
    clarity_words = {"explain", "step", "process", "next", "option", "alternativ"}

    scores = []
    feedback_items: list[str] = []

    for i, t in enumerate(transcripts):
        t_lower = (t or "").lower().strip()
        words = set(re.findall(r"\b\w{4,}\b", t_lower))
        emp = len(empathy_words & words) / max(1, len(empathy_words))
        act = len(action_words & words) / max(1, len(action_words))
        length_ok = 10 <= len(t_lower.split()) <= 150  # not too short, not rambling
        scores.append(emp * 0.4 + act * 0.4 + (0.2 if length_ok else 0))

    overall = int(sum(scores) / max(1, len(scores)) * 100) if scores else 50
    overall = max(1, min(100, overall))

    if overall >= 70:
        summary = "You showed strong customer care—acknowledging concerns and taking action. Keep it up."
    elif overall >= 50:
        summary = "You addressed customer needs. Focus on showing more empathy and clearly stating next steps."
    else:
        summary = "Responses could better acknowledge the customer's frustration and outline concrete actions."

    feedback_items = [
        "Acknowledge the customer's feelings before jumping to solutions.",
        "Offer specific next steps (e.g., 'I'll check with…', 'Let me transfer you to…').",
        "Apologize when appropriate—even if the issue isn't your fault personally.",
        "Keep responses clear and concise—avoid jargon.",
        "Confirm what you'll do and when the customer can expect resolution.",
    ]

    return {"summary": summary, "score": overall, "improvements": feedback_items[:5]}


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
