"""
Skill-Gap Intelligence Engine for ProjectForge.
Calculates:
- Possessed vs. missing skills
- Importance-weighted Project Readiness Score
- Prerequisite breakdown and learning preparation roadmaps
"""

from typing import Dict, List, Set, Tuple, Optional
from .taxonomy import normalize_skill_name, normalize_skill_list, get_skill_metadata

class SkillGapEngine:
    @staticmethod
    def analyze_gap(
        student_skills: List[str],
        project: Dict,
        student_proficiency: Optional[Dict[str, str]] = None
    ) -> Dict:
        """
        Performs comprehensive skill gap analysis for a student on a specific project.
        Considers proficiency levels (Beg: 0.60, Int: 0.85, Adv: 1.0) when provided.
        """
        norm_student = set(normalize_skill_list(student_skills))
        required_skills = normalize_skill_list(project.get("required_skills", []))
        skill_importance = project.get("skill_importance", {})
        prof_map = student_proficiency or {}

        matched_skills: List[str] = []
        missing_skills: List[Dict] = []
        
        sum_matched_weight = 0.0
        sum_total_weight = 0.0

        for skill in required_skills:
            weight = float(skill_importance.get(skill, 1.0 / max(1, len(required_skills))))
            sum_total_weight += weight

            if skill in norm_student:
                matched_skills.append(skill)
                if student_proficiency is not None:
                    level = prof_map.get(skill, "Intermediate")
                    level_mult = 1.0 if level == "Advanced" else (0.85 if level == "Intermediate" else 0.60)
                else:
                    level_mult = 1.0
                sum_matched_weight += weight * level_mult
            else:
                meta = get_skill_metadata(skill)
                # Check prerequisites status
                missing_prereqs = [p for p in meta.get("prereqs", []) if p not in norm_student]
                missing_skills.append({
                    "skill": skill,
                    "category": meta.get("category", "General"),
                    "importance": round(weight, 3),
                    "estimated_prep_hours": meta.get("base_learning_hours", 15),
                    "prerequisites": missing_prereqs
                })

        # Calculate readiness score
        if sum_total_weight > 0:
            readiness = round(sum_matched_weight / sum_total_weight, 4)
        else:
            readiness = 1.0 if not required_skills else 0.0

        readiness = min(1.0, max(0.0, readiness))
        readiness_pct = int(round(readiness * 100))

        # Total preparation hours
        total_prep_hours = sum(item["estimated_prep_hours"] for item in missing_skills)

        # Generate preparation roadmap suggestions
        prep_steps = []
        for item in missing_skills:
            sk = item["skill"]
            hrs = item["estimated_prep_hours"]
            days = max(1, round(hrs / 4.0))  # Assuming ~4 hours study per day
            if item["prerequisites"]:
                prereq_str = f" (prerequisites: {', '.join(item['prerequisites'])})"
            else:
                prereq_str = ""
            prep_steps.append(f"{days} day{'s' if days > 1 else ''} (~{hrs}h) of {sk} practice and core tutorials{prereq_str}")

        if not prep_steps:
            prep_steps.append("You already meet 100% of the technical skill prerequisites! Ready to build immediately.")

        return {
            "project_id": project.get("project_id", ""),
            "project_title": project.get("title", ""),
            "readiness_score": readiness,
            "readiness_percentage": readiness_pct,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "missing_skill_names": [m["skill"] for m in missing_skills],
            "total_prep_hours": total_prep_hours,
            "estimated_prep_roadmap": prep_steps
        }
