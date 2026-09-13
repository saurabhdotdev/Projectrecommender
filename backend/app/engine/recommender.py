"""
ProjectForge Master Recommender Pipeline.
Orchestrates:
- Feature Preprocessing & Vectorization
- Stage 1: Content-Based Relevance
- Stage 2: Weighted Multi-Factor Personalization & Attributions
- Skill-Gap Analysis & Readiness Scoring
- Maximal Marginal Relevance (MMR) Anti-Repetition Filtering
- Multi-Perspective Slices (Best Match, Learning, Resume, Quick Win, Stretch)
- Explainable "Why recommended" Layer
"""

import time
from typing import Dict, List, Optional
from .preprocessor import FeaturePreprocessor
from .content_recommender import ContentRecommender
from .personalized_ranker import PersonalizedRanker
from .skill_gap import SkillGapEngine
from .diversity import DiversityEngine
from .explainer import ExplanationEngine

class ProjectForgeRecommender:
    def __init__(self, projects: List[Dict]):
        self.projects_dict: Dict[str, Dict] = {p["project_id"]: p for p in projects}
        self.projects_list: List[Dict] = projects
        
        # Fit preprocessor
        self.preprocessor = FeaturePreprocessor()
        self.preprocessor.fit_projects(projects)
        self.content_recommender = ContentRecommender(self.preprocessor)

    def recommend(
        self,
        student_profile: Dict,
        top_k: int = 12,
        enable_diversity: bool = True,
        diversity_lambda: float = 0.70,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> Dict:
        start_time = time.time()

        # 1. Stage 1 Content Similarity
        content_scores = self.content_recommender.score_projects(student_profile)

        # 2. Score every project in catalog
        scored_candidates: List[Dict] = []
        for p in self.projects_list:
            pid = p["project_id"]
            content_sim = content_scores.get(pid, 0.0)

            # Skill Gap
            gap = SkillGapEngine.analyze_gap(
                student_profile.get("skills", []),
                p,
                student_profile.get("skill_proficiency")
            )

            # Personalized Ranking
            ranking = PersonalizedRanker.compute_project_score(
                student_profile,
                p,
                content_sim,
                gap,
                custom_weights
            )

            # Explainability
            expl = ExplanationEngine.generate_explanation(student_profile, p, ranking, gap)

            scored_candidates.append({
                "project_id": pid,
                "title": p["title"],
                "description": p["description"],
                "domain": p["domain"],
                "subdomain": p["subdomain"],
                "difficulty": p["difficulty"],
                "score": ranking["final_score"],
                "match_percentage": ranking["match_percentage"],
                "readiness": gap["readiness_score"],
                "readiness_percentage": gap["readiness_percentage"],
                "estimated_duration": p["estimated_duration"],
                "required_skills": p["required_skills"],
                "matched_skills": gap["matched_skills"],
                "missing_skills": gap["missing_skill_names"],
                "reasons": expl["reasons"],
                "cautions": expl["cautions"],
                "score_components": expl["score_components"],
                "resume_value": p.get("resume_value", 8.8),
                "originality_score": p.get("originality_score", 9.0),
                "learning_value": ranking["components"]["learning_value"],
                "time_feasibility": ranking["components"]["time_feasibility"],
                "programming_languages": p.get("programming_languages", []),
                "frameworks": p.get("frameworks", []),
                "tools": p.get("tools", []),
                "prerequisites": p.get("prerequisites", []),
                "career_paths": p.get("career_paths", []),
                "learning_outcomes": p.get("learning_outcomes", []),
                "dataset_available": p.get("dataset_available", False),
                "dataset_source": p.get("dataset_source", ""),
                "project_type": p.get("project_type", "Applied Engineering Project")
            })

        # Sort candidates by raw personalized score descending
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)

        # 3. Apply MMR Diversity Filtering if requested
        if enable_diversity:
            top_recommendations = DiversityEngine.apply_mmr(
                scored_candidates,
                top_k=top_k,
                lambda_param=diversity_lambda
            )
        else:
            top_recommendations = scored_candidates[:top_k]

        # 4. Extract Multi-Perspective Slices
        perspectives = self._compute_perspectives(scored_candidates, student_profile)

        exec_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "student_id": student_profile.get("student_id", "student"),
            "recommendations": top_recommendations,
            "perspectives": perspectives,
            "total_catalog_size": len(self.projects_list),
            "execution_time_ms": exec_ms
        }

    def _compute_perspectives(self, scored_pool: List[Dict], student_profile: Dict) -> Dict[str, Optional[Dict]]:
        """
        Derives the 5 distinct perspective recommendations:
        - best_match
        - best_learning_opportunity
        - best_resume_project
        - quick_win
        - stretch_project
        """
        if not scored_pool:
            return {
                "best_match": None,
                "best_learning_opportunity": None,
                "best_resume_project": None,
                "quick_win": None,
                "stretch_project": None
            }

        # Best Match: highest overall score
        best_match = scored_pool[0]
        best_match_copy = dict(best_match)
        best_match_copy["perspective"] = "best_match"

        # Best Learning Opportunity: highest learning value & moderate readiness (not 100%, not < 40%)
        learning_candidates = [
            p for p in scored_pool
            if 0.40 <= p["readiness"] <= 0.85 and len(p["missing_skills"]) >= 1
        ]
        if not learning_candidates:
            learning_candidates = scored_pool
        best_learning = max(learning_candidates, key=lambda x: (x["learning_value"], x["score"]))
        best_learning_copy = dict(best_learning)
        best_learning_copy["perspective"] = "best_learning_opportunity"

        # Best Resume Project: highest portfolio impact (resume_value + originality)
        best_resume = max(scored_pool, key=lambda x: (x["resume_value"] * 1.2 + x["originality_score"], x["score"]))
        best_resume_copy = dict(best_resume)
        best_resume_copy["perspective"] = "best_resume_project"

        # Quick Win: fits within available time with high readiness (>= 0.75)
        avail = student_profile.get("available_time_weeks", 4.0)
        quick_candidates = [
            p for p in scored_pool
            if p["estimated_duration"] <= avail and p["readiness"] >= 0.70
        ]
        if not quick_candidates:
            quick_candidates = [p for p in scored_pool if p["estimated_duration"] <= avail]
        if not quick_candidates:
            quick_candidates = scored_pool
        quick_win = max(quick_candidates, key=lambda x: (x["time_feasibility"], x["readiness"], x["score"]))
        quick_win_copy = dict(quick_win)
        quick_win_copy["perspective"] = "quick_win"

        # Stretch Project: difficulty is Advanced (or > student), but readiness is achievable (>= 0.35)
        stretch_candidates = [
            p for p in scored_pool
            if p["difficulty"] == "Advanced" and 0.30 <= p["readiness"] <= 0.75
        ]
        if not stretch_candidates:
            stretch_candidates = [p for p in scored_pool if p["difficulty"] == "Advanced"]
        if not stretch_candidates:
            stretch_candidates = scored_pool
        stretch_project = max(stretch_candidates, key=lambda x: (x["resume_value"], x["score"]))
        stretch_project_copy = dict(stretch_project)
        stretch_project_copy["perspective"] = "stretch_project"

        return {
            "best_match": best_match_copy,
            "best_learning_opportunity": best_learning_copy,
            "best_resume_project": best_resume_copy,
            "quick_win": quick_win_copy,
            "stretch_project": stretch_project_copy
        }
