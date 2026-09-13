import io
import re
import json
import logging
from typing import Dict, Any, List, Optional
from pypdf import PdfReader

from ..engine.taxonomy import SKILL_TAXONOMY_REGISTRY, SKILL_ALIASES, VALID_DOMAINS, normalize_skill_name
from ..services.groq_service import get_groq_client
from ..config import settings

logger = logging.getLogger("projectforge.resume_parser")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract clean text content from PDF bytes using pypdf."""
    reader = PdfReader(io.BytesIO(file_bytes))
    extracted_text = []
    for page_num, page in enumerate(reader.pages):
        page_text = page.extract_text()
        if page_text:
            extracted_text.append(page_text)
    full_text = "\n".join(extracted_text)
    # Normalize multiple whitespace / newlines
    cleaned = re.sub(r'[ \t]+', ' ', full_text)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned.strip()


def extract_skills_rule_based(text: str) -> List[str]:
    """
    Extracts canonical skills from resume text using taxonomy registry and aliases.
    Handles multi-word skills, word boundaries, and case insensitivity.
    """
    detected_skills = set()
    text_lower = text.lower()

    # 1. Multi-word phrases & aliases first
    # Sort aliases by length descending so longer phrases match first
    sorted_aliases = sorted(SKILL_ALIASES.items(), key=lambda x: len(x[0]), reverse=True)
    for alias, canonical in sorted_aliases:
        # Avoid short ambiguous tokens without strict boundaries
        if len(alias) <= 2:
            pattern = rf'(?<![a-zA-Z0-9]){re.escape(alias)}(?![a-zA-Z0-9])'
            if re.search(pattern, text_lower):
                detected_skills.add(canonical)
        else:
            pattern = rf'\b{re.escape(alias)}\b'
            if re.search(pattern, text_lower):
                detected_skills.add(canonical)

    # 2. Check canonical names directly in taxonomy registry
    for canonical in SKILL_TAXONOMY_REGISTRY.keys():
        if canonical.lower() in text_lower:
            pattern = rf'\b{re.escape(canonical.lower())}\b'
            if re.search(pattern, text_lower):
                detected_skills.add(canonical)

    return sorted(list(detected_skills))


def extract_degree_and_year(text: str) -> Dict[str, str]:
    """Detects degree/major and academic year from text heuristics."""
    info = {"degree": "Computer Science", "year": "3rd year"}
    text_lower = text.lower()

    # Degree detection
    if "data science" in text_lower or "artificial intelligence" in text_lower or "ai & ds" in text_lower:
        info["degree"] = "AI & Data Science"
    elif "electronics" in text_lower or "ece" in text_lower or "vlsi" in text_lower:
        info["degree"] = "Electronics & Communication"
    elif "robotics" in text_lower:
        info["degree"] = "Robotics & Automation"
    elif "mechanical" in text_lower:
        info["degree"] = "Mechanical Engineering"
    elif "biomedical" in text_lower or "biotech" in text_lower:
        info["degree"] = "Biomedical Engineering"
    elif "information technology" in text_lower or "it" in text_lower.split():
        info["degree"] = "Information Technology"
    elif "computer science" in text_lower or "cs" in text_lower.split() or "cse" in text_lower:
        info["degree"] = "Computer Science"

    # Year / Standing detection
    if any(y in text_lower for y in ["1st year", "first year", "freshman"]):
        info["year"] = "1st year"
    elif any(y in text_lower for y in ["2nd year", "second year", "sophomore"]):
        info["year"] = "2nd year"
    elif any(y in text_lower for y in ["4th year", "fourth year", "final year", "senior"]):
        info["year"] = "4th year / Final Year"
    elif any(y in text_lower for y in ["3rd year", "third year", "junior"]):
        info["year"] = "3rd year"
    elif "graduated" in text_lower or "graduate student" in text_lower or "master" in text_lower:
        info["year"] = "Graduate Student / Alum"

    return info


def extract_interests_and_domains(text: str) -> List[str]:
    """Matches text against canonical domains."""
    detected = []
    text_lower = text.lower()
    for domain in VALID_DOMAINS:
        dom_clean = domain.lower()
        parts = [p.strip() for p in dom_clean.replace("&", ",").replace("/", ",").split(",") if p.strip()]
        if any(p in text_lower for p in parts):
            detected.append(domain)
    return detected[:4] or ["Machine Learning", "Web Development"]


def parse_resume_content(text: str) -> Dict[str, Any]:
    """
    Combines rule-based extraction with optional Groq LLM refinement
    to generate an auto-filled StudentProfile.
    """
    rule_skills = extract_skills_rule_based(text)
    deg_year = extract_degree_and_year(text)
    interests = extract_interests_and_domains(text)

    # Detect experience level
    exp_level = "Intermediate"
    if len(rule_skills) <= 3:
        exp_level = "Beginner"
    elif len(rule_skills) >= 9 or any(k in text.lower() for k in ["lead", "architect", "senior", "3+ years", "published"]):
        exp_level = "Advanced"

    # Detect preferred language from skills
    langs = [s for s in rule_skills if s in ["Python", "JavaScript", "TypeScript", "C++", "Java", "Go", "Rust"]]
    pref_lang = langs[0] if langs else "Python"

    base_result = {
        "degree": deg_year["degree"],
        "year": deg_year["year"],
        "experience_level": exp_level,
        "skills": rule_skills,
        "interests": interests,
        "preferred_language": pref_lang,
        "career_goal": "Internship" if "intern" in text.lower() else "Full-time Job",
        "available_time_weeks": 4.0,
        "extracted_text_preview": text[:400] + ("..." if len(text) > 400 else ""),
        "total_skills_detected": len(rule_skills)
    }

    # Attempt LLM extraction for higher precision if client available
    client = get_groq_client()
    if client and len(text.strip()) > 30:
        try:
            prompt = f"""You are an expert technical talent recruiter and resume parser.
Extract the student's profile information from their resume/profile text below.

Text:
{text[:2500]}

Respond ONLY with this JSON schema:
{{
  "degree": "string (e.g. Computer Science, VLSI, Robotics)",
  "year": "string (e.g. 1st year, 2nd year, 3rd year, 4th year / Final Year, Graduate)",
  "experience_level": "Beginner|Intermediate|Advanced",
  "skills": ["Canonical Skill 1", "Canonical Skill 2", "..."],
  "interests": ["Domain 1", "Domain 2"],
  "career_goal": "Internship|Full-time Job|Research|Portfolio",
  "preferred_language": "Python|JavaScript|C++|Java|Go|Rust"
}}"""

            models_to_try = [settings.GROQ_MODEL, "llama-3.3-70b-versatile", "llama3-8b-8192"]
            parsed = None
            for model in models_to_try:
                try:
                    completion = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": "You output valid JSON only."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.2,
                        max_tokens=400,
                        response_format={"type": "json_object"}
                    )
                    raw = completion.choices[0].message.content.strip()
                    if raw.startswith("```"):
                        raw = raw.split("```")[1]
                        if raw.startswith("json"):
                            raw = raw[4:]
                    parsed = json.loads(raw)
                    break
                except Exception:
                    continue
            if not parsed:
                raise ValueError("All Groq models failed")

            # Merge LLM skills with rule-based skills
            llm_skills = [normalize_skill_name(s) for s in parsed.get("skills", []) if s]
            merged_skills = sorted(list(set(rule_skills + llm_skills)))

            if parsed.get("degree"):
                base_result["degree"] = parsed["degree"]
            if parsed.get("year"):
                base_result["year"] = parsed["year"]
            if parsed.get("experience_level") in ["Beginner", "Intermediate", "Advanced"]:
                base_result["experience_level"] = parsed["experience_level"]
            if parsed.get("career_goal"):
                base_result["career_goal"] = parsed["career_goal"]
            if parsed.get("preferred_language"):
                base_result["preferred_language"] = parsed["preferred_language"]
            if parsed.get("interests"):
                base_result["interests"] = parsed["interests"]
            base_result["skills"] = merged_skills
            base_result["total_skills_detected"] = len(merged_skills)
            base_result["parser_engine"] = "hybrid-groq-taxonomy"
            return base_result
        except Exception as e:
            logger.warning(f"LLM resume parsing refinement skipped/failed: {e}")

    base_result["parser_engine"] = "rule-based-taxonomy"
    return base_result
