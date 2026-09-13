"""
Explainability Engine for ProjectForge.
Translates multi-factor score attributions, skill gaps, and constraints into clear,
human-readable "Why am I seeing this project?" justifications.
"""

from typing import Dict, List

class ExplanationEngine:
    @staticmethod
    def generate_explanation(
        student_profile: Dict,
        project: Dict,
        scoring_details: Dict,
        gap_details: Dict
    ) -> Dict:
        """
        Generates positive reasons, cautions, and a high-level mentor explanation summary.
        """
        reasons: List[str] = []
        cautions: List[str] = []
        comps = scoring_details["components"]

        # Skill Compatibility
        matched = gap_details.get("matched_skills", [])
        if matched:
            top_skills = ", ".join(matched[:3])
            reasons.append(f"Strong compatibility with your existing skills ({top_skills})")
        
        # Readiness score
        readiness_pct = gap_details.get("readiness_percentage", 0)
        if readiness_pct >= 75:
            reasons.append(f"High technical readiness ({readiness_pct}% of required skills already possessed)")
        elif readiness_pct >= 50:
            reasons.append(f"Manageable skill gap ({readiness_pct}% readiness with clear prep roadmap)")

        # Interest Match
        p_dom = project.get("domain", "")
        p_sub = project.get("subdomain", "")
        interests = student_profile.get("interests", [])
        matched_interests = [i for i in interests if i.lower() in p_dom.lower() or i.lower() in p_sub.lower() or (i.lower() in ["ai", "ml"] and "learning" in p_dom.lower())]
        if matched_interests:
            reasons.append(f"Directly aligns with your interest in {', '.join(matched_interests)}")

        # Career Goal
        goal = student_profile.get("career_goal", "")
        if goal:
            reasons.append(f"High portfolio relevance for your {goal} objective")

        # Time Feasibility
        avail_weeks = student_profile.get("available_time_weeks", 4.0)
        proj_weeks = project.get("estimated_duration", 4.0)
        if proj_weeks <= avail_weeks:
            reasons.append(f"Estimated duration ({proj_weeks:.0f} wks) comfortably fits your {avail_weeks:.0f}-week timeline")
        else:
            cautions.append(f"Duration ({proj_weeks:.0f} wks) is slightly beyond your {avail_weeks:.0f}-week schedule")

        # Difficulty
        st_level = student_profile.get("experience_level", "Intermediate")
        pr_level = project.get("difficulty", "Intermediate")
        if st_level == pr_level:
            reasons.append(f"Perfect match for your {st_level.lower()} experience level")
        elif pr_level == "Advanced" and st_level == "Intermediate":
            reasons.append("Great stretch project to elevate your technical level")

        # Missing skills as cautions
        missing = gap_details.get("missing_skill_names", [])
        if missing:
            cautions.append(f"Skill gap to bridge: {', '.join(missing[:4])}")
            prep_hrs = gap_details.get("total_prep_hours", 0)
            if prep_hrs > 0:
                cautions.append(f"Estimated prerequisite prep time: ~{prep_hrs} hours before development")
        else:
            reasons.append("Zero skill gaps! You can begin implementation immediately without new tooling overhead")

        # Dataset
        if project.get("dataset_available", False):
            reasons.append(f"Verified dataset available: {project.get('dataset_source', 'Public benchmark')}")

        summary = f"{scoring_details['match_percentage']}% Match — "
        if reasons:
            summary += reasons[0]

        return {
            "summary": summary,
            "reasons": reasons,
            "cautions": cautions,
            "score_components": {
                "Skill Compatibility": round(comps["skill_compatibility"] * 100, 1),
                "Interest Alignment": round(comps["interest_match"] * 100, 1),
                "Career Relevance": round(comps["career_goal_match"] * 100, 1),
                "Difficulty Fit": round(comps["difficulty_fit"] * 100, 1),
                "Time Feasibility": round(comps["time_feasibility"] * 100, 1),
                "Tech Preference": round(comps["technology_preference"] * 100, 1),
                "Learning Value": round(comps["learning_value"] * 100, 1),
                "Resume Impact": round(comps["resume_relevance"] * 100, 1)
            }
        }
