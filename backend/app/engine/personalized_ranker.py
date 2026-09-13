"""
Stage 2: Personalized Multi-Factor Ranking Engine for ProjectForge.
Computes multi-factor weighted scores, perspective classifications,
and transparent score attributions.
"""

from typing import Dict, List, Tuple, Optional
import numpy as np
from .skill_gap import SkillGapEngine
from .taxonomy import normalize_difficulty, normalize_skill_list

class PersonalizedRanker:
    DEFAULT_WEIGHTS = {
        "skill_compatibility": 0.25,
        "interest_match": 0.40,   # boosted — interests must dominate
        "career_goal_match": 0.10,
        "difficulty_fit": 0.08,
        "time_feasibility": 0.07,
        "technology_preference": 0.04,
        "learning_value": 0.03,
        "resume_relevance": 0.03,
        "past_project_penalty": 0.15
    }

    DIFF_LEVELS = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}

    @classmethod
    def compute_project_score(
        cls,
        student_profile: Dict,
        project: Dict,
        content_sim: float,
        gap_analysis: Dict,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> Dict:
        """
        Calculates all 8 sub-scores, final weighted score, and attribution breakdown.
        """
        w = dict(cls.DEFAULT_WEIGHTS)
        if custom_weights:
            w.update(custom_weights)

        # Normalize positive ranking weights so they always sum to 1.0 (100%)
        pos_keys = [
            "skill_compatibility", "interest_match", "career_goal_match",
            "difficulty_fit", "time_feasibility", "technology_preference",
            "learning_value", "resume_relevance"
        ]
        pos_sum = sum(float(w.get(k, 0.0)) for k in pos_keys)
        if pos_sum > 0:
            for k in pos_keys:
                w[k] = float(w.get(k, 0.0)) / pos_sum

        # 1. Skill Compatibility (combines readiness and content similarity)
        readiness = gap_analysis["readiness_score"]
        skill_compat = round(0.50 * readiness + 0.50 * content_sim, 4)

        # 2. Interest Match
        student_interests = [i.lower().strip() for i in student_profile.get("interests", [])]
        p_domain = project.get("domain", "").lower()
        p_subdomain = project.get("subdomain", "").lower()
        p_title = project.get("title", "").lower()
        
        interest_score = 0.5  # Neutral default if no interests specified
        if student_interests:
            matches = 0
            for intr in student_interests:
                intr_tokens = intr.split()
                if intr in p_domain or intr in p_subdomain or intr in p_title or any(tok in p_domain or tok in p_subdomain or tok in p_title for tok in intr_tokens if len(tok) > 2):
                    matches += 1
                elif any(k in intr for k in ["health", "care", "medic", "clinic", "bio"]) and any(k in p_domain or k in p_subdomain for k in ["health", "bioinformatics", "medic", "clinic"]):
                    matches += 1
                elif any(k in intr for k in ["ai", "ml", "machine learning", "deep learning", "nlp", "vision", "data"]) and any(k in p_domain for k in ["artificial intelligence", "machine learning", "natural language", "computer vision", "data science"]):
                    matches += 1
                elif any(k in intr for k in ["web", "frontend", "fullstack", "backend"]) and "web" in p_domain:
                    matches += 1
                elif any(k in intr for k in ["security", "cyber", "network"]) and "security" in p_domain:
                    matches += 1
                elif any(k in intr for k in ["finance", "fintech", "quant", "stock", "crypto"]) and "fintech" in p_domain:
                    matches += 1
            
            match_ratio = matches / max(1, len(student_interests))
            # If both interests matched, give high score 0.95 - 1.0
            interest_score = min(1.0, round(0.50 + 0.50 * match_ratio, 4)) if matches > 0 else 0.20

        # 3. Career Goal Match
        career_goal = student_profile.get("career_goal", "Internship").lower()
        career_paths = [c.lower() for c in project.get("career_paths", [])]
        career_score = 0.70  # default baseline
        if "intern" in career_goal:
            # Internships prize high practical skill match & industry tools
            career_score = 0.85 if any("intern" in c or "engineer" in c or "scientist" in c for c in career_paths) else 0.70
        elif "research" in career_goal:
            career_score = 0.95 if project.get("originality_score", 8.0) >= 8.8 or "Research" in project.get("project_type", "") else 0.65
        elif "job" in career_goal or "full-time" in career_goal:
            career_score = 0.90 if project.get("resume_value", 8.0) >= 8.5 else 0.70
        elif "portfolio" in career_goal:
            career_score = min(1.0, project.get("resume_value", 8.0) / 10.0)

        # 4. Difficulty Fit
        st_diff_str = student_profile.get("preferred_difficulty", student_profile.get("experience_level", "Intermediate"))
        st_diff = cls.DIFF_LEVELS.get(normalize_difficulty(st_diff_str), 2)
        pr_diff = cls.DIFF_LEVELS.get(normalize_difficulty(project.get("difficulty", "Intermediate")), 2)
        diff_delta = pr_diff - st_diff
        
        if diff_delta == 0:
            difficulty_fit = 1.0
        elif diff_delta == 1:
            difficulty_fit = 0.80  # Moderate stretch
        elif diff_delta == -1:
            difficulty_fit = 0.75  # Slightly easy
        elif diff_delta >= 2:
            difficulty_fit = 0.35  # Much too hard
        else:
            difficulty_fit = 0.50  # Much too easy

        # 5. Time Feasibility
        avail_weeks = float(student_profile.get("available_time_weeks", 4.0))
        proj_weeks = float(project.get("estimated_duration", 4.0))
        
        # Base duration feasibility
        if proj_weeks <= avail_weeks:
            base_feasibility = 1.0
        elif proj_weeks <= avail_weeks * 1.25:
            base_feasibility = 0.85
        elif proj_weeks <= avail_weeks * 1.5:
            base_feasibility = 0.65
        else:
            base_feasibility = max(0.20, 1.0 - (proj_weeks - avail_weeks) / avail_weeks)

        # Mild prep deduction if extensive prep required (> 40 hours)
        prep_hrs = gap_analysis["total_prep_hours"]
        prep_discount = min(0.15, max(0.0, (prep_hrs - 20) / 150.0))
        time_feasibility = max(0.20, round(base_feasibility - prep_discount, 4))

        # 6. Technology Preference
        pref_lang = student_profile.get("preferred_language", "Python")
        pref_techs = normalize_skill_list(student_profile.get("preferred_technologies", []))
        proj_langs = project.get("programming_languages", [])
        proj_frameworks = project.get("frameworks", [])
        
        tech_matches = 0
        tech_checks = 1 + len(pref_techs)
        if pref_lang in proj_langs:
            tech_matches += 1
        for pt in pref_techs:
            if pt in proj_langs or pt in proj_frameworks or pt in project.get("tools", []):
                tech_matches += 1
        tech_pref = min(1.0, round(tech_matches / max(1, tech_checks), 4))

        # 7. Learning Value
        # Optimal learning value is when student has some missing skills (1 to 3),
        # not 0 (no learning) and not > 5 (overwhelmed)
        n_missing = len(gap_analysis["missing_skills"])
        if n_missing == 0:
            learning_value = 0.65  # Good for fast delivery, but less new skill growth
        elif 1 <= n_missing <= 3:
            learning_value = 0.95  # Golden learning zone!
        elif 4 <= n_missing <= 5:
            learning_value = 0.75
        else:
            learning_value = 0.45  # Too steep

        # 8. Resume Relevance
        res_val = float(project.get("resume_value", 8.0)) / 10.0
        orig_val = float(project.get("originality_score", 8.0)) / 10.0
        dataset_bonus = 0.05 if project.get("dataset_available", False) else 0.0
        resume_relevance = min(1.0, round(0.55 * res_val + 0.40 * orig_val + dataset_bonus, 4))

        # 9. Past Project Similarity Penalty
        past_projects = [p.lower() for p in student_profile.get("past_projects", [])]
        penalty = 0.0
        if past_projects:
            for past in past_projects:
                if past in p_title or past in p_subdomain:
                    penalty = 0.35
                    break

        # Calculate final composite score
        final_score = (
            w["skill_compatibility"] * skill_compat +
            w["interest_match"] * interest_score +
            w["career_goal_match"] * career_score +
            w["difficulty_fit"] * difficulty_fit +
            w["time_feasibility"] * time_feasibility +
            w["technology_preference"] * tech_pref +
            w["learning_value"] * learning_value +
            w["resume_relevance"] * resume_relevance -
            w["past_project_penalty"] * penalty
        )
        final_score = max(0.05, min(0.99, round(final_score, 4)))
        match_pct = int(round(final_score * 100))

        return {
            "final_score": final_score,
            "match_percentage": match_pct,
            "components": {
                "skill_compatibility": skill_compat,
                "interest_match": interest_score,
                "career_goal_match": career_score,
                "difficulty_fit": difficulty_fit,
                "time_feasibility": time_feasibility,
                "technology_preference": tech_pref,
                "learning_value": learning_value,
                "resume_relevance": resume_relevance,
                "penalty": penalty
            }
        }
