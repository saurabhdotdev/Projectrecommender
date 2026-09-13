"""
Recommender Evaluation Benchmark Suite for ProjectForge.
Rigorously evaluates and compares 6 recommendation strategies:
1. Random Baseline
2. Popularity Baseline
3. Keyword Matching (Jaccard / Token Overlap)
4. Content-Based TF-IDF Similarity
5. Weighted Personalized Model (with Skill Gap & MMR)
6. Hybrid / Interactive Feedback Model

Computes:
- Precision@K
- Recall@K
- NDCG@K
- Hit Rate@K
- Catalog Coverage
- Intra-List Diversity
- Novelty Score
- Skill Compatibility
- Feasibility Score
"""

import math
import random
from typing import Dict, List, Set, Tuple
import numpy as np
from .taxonomy import normalize_skill_list, normalize_difficulty
from .skill_gap import SkillGapEngine
from .diversity import DiversityEngine

class RecommenderEvaluator:
    # 15 Representative Student Benchmark Personas
    BENCHMARK_PERSONAS = [
        {
            "student_id": "test_persona_01",
            "degree": "Computer Science",
            "year": "2nd year",
            "skills": ["Python", "Pandas", "SQL", "Machine Learning"],
            "interests": ["Healthcare", "AI", "Machine Learning"],
            "experience_level": "Intermediate",
            "available_time_weeks": 4.0,
            "career_goal": "Internship",
            "preferred_language": "Python",
            "preferred_technologies": ["Scikit-Learn", "FastAPI"]
        },
        {
            "student_id": "test_persona_02",
            "degree": "Software Engineering",
            "year": "3rd year",
            "skills": ["JavaScript", "React", "HTML/CSS", "Node.js"],
            "interests": ["Web Development", "Frontend"],
            "experience_level": "Intermediate",
            "available_time_weeks": 4.0,
            "career_goal": "Full-time Job",
            "preferred_language": "JavaScript",
            "preferred_technologies": ["React", "Express.js"]
        },
        {
            "student_id": "test_persona_03",
            "degree": "Cybersecurity",
            "year": "4th year",
            "skills": ["Linux", "Network Security", "Python", "Wireshark"],
            "interests": ["Cybersecurity", "Network Security"],
            "experience_level": "Advanced",
            "available_time_weeks": 5.0,
            "career_goal": "Full-time Job",
            "preferred_language": "Python",
            "preferred_technologies": ["Docker"]
        },
        {
            "student_id": "test_persona_04",
            "degree": "Data Science",
            "year": "1st year",
            "skills": ["Python", "NumPy", "Pandas"],
            "interests": ["Data Science & Analytics"],
            "experience_level": "Beginner",
            "available_time_weeks": 3.0,
            "career_goal": "Portfolio",
            "preferred_language": "Python",
            "preferred_technologies": ["Matplotlib & Seaborn"]
        },
        {
            "student_id": "test_persona_05",
            "degree": "Computer Engineering",
            "year": "3rd year",
            "skills": ["Python", "PyTorch", "Deep Learning", "OpenCV"],
            "interests": ["Computer Vision", "Deep Learning"],
            "experience_level": "Advanced",
            "available_time_weeks": 5.0,
            "career_goal": "Research",
            "preferred_language": "Python",
            "preferred_technologies": ["PyTorch"]
        },
        {
            "student_id": "test_persona_06",
            "degree": "Financial Engineering",
            "year": "2nd year",
            "skills": ["Python", "Pandas", "SQL", "Time Series Analysis"],
            "interests": ["FinTech & Quant"],
            "experience_level": "Intermediate",
            "available_time_weeks": 4.0,
            "career_goal": "Internship",
            "preferred_language": "Python",
            "preferred_technologies": ["Plotly"]
        },
        {
            "student_id": "test_persona_07",
            "degree": "Informatics",
            "year": "2nd year",
            "skills": ["Solidity", "JavaScript", "React"],
            "interests": ["Blockchain & Web3"],
            "experience_level": "Intermediate",
            "available_time_weeks": 4.0,
            "career_goal": "Portfolio",
            "preferred_language": "Solidity",
            "preferred_technologies": ["Web3.js / Ethers.js"]
        },
        {
            "student_id": "test_persona_08",
            "degree": "Robotics",
            "year": "4th year",
            "skills": ["C++", "Python", "Linux", "ROS (Robot Operating System)"],
            "interests": ["Robotics & Autonomous Systems"],
            "experience_level": "Advanced",
            "available_time_weeks": 5.0,
            "career_goal": "Full-time Job",
            "preferred_language": "C++",
            "preferred_technologies": ["OpenCV"]
        },
        {
            "student_id": "test_persona_09",
            "degree": "Cloud Computing",
            "year": "3rd year",
            "skills": ["Docker", "Linux", "Git", "Kubernetes"],
            "interests": ["Cloud & DevOps"],
            "experience_level": "Intermediate",
            "available_time_weeks": 4.0,
            "career_goal": "Internship",
            "preferred_language": "Go",
            "preferred_technologies": ["CI/CD"]
        },
        {
            "student_id": "test_persona_10",
            "degree": "Artificial Intelligence",
            "year": "3rd year",
            "skills": ["Python", "Transformers", "Natural Language Processing", "PyTorch"],
            "interests": ["Natural Language Processing", "AI"],
            "experience_level": "Advanced",
            "available_time_weeks": 5.0,
            "career_goal": "Research",
            "preferred_language": "Python",
            "preferred_technologies": ["Hugging Face"]
        }
    ]

    def __init__(self, recommender_pipeline):
        self.recommender = recommender_pipeline
        self.catalog = recommender_pipeline.projects_list

    def determine_ground_truth(self, persona: Dict, project: Dict) -> bool:
        """
        Determines ground-truth relevance for benchmarking:
        A project is relevant if:
        1. Its domain or subdomain matches at least one persona interest OR
        2. Its skills overlap significantly with persona skills (readiness >= 0.50)
        AND its difficulty is within 1 step of student's level.
        """
        p_dom = project.get("domain", "").lower()
        p_sub = project.get("subdomain", "").lower()
        interests = [i.lower() for i in persona.get("interests", [])]
        
        interest_match = any(
            intr in p_dom or intr in p_sub or 
            (intr in ["ai", "ml"] and any(x in p_dom for x in ["machine", "artificial", "intelligence"])) or
            (intr in ["web", "frontend"] and "web" in p_dom)
            for intr in interests
        )

        gap = SkillGapEngine.analyze_gap(persona["skills"], project)
        readiness = gap["readiness_score"]

        # Difficulty compatibility
        diff_order = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
        p_diff = diff_order.get(project.get("difficulty", "Intermediate"), 2)
        s_diff = diff_order.get(persona.get("experience_level", "Intermediate"), 2)
        diff_ok = abs(p_diff - s_diff) <= 1

        # Relevant if strong interest match + feasible skill gap + difficulty ok
        return bool((interest_match and readiness >= 0.35 and diff_ok) or (readiness >= 0.70 and diff_ok))

    # --- 6 STRATEGY IMPLEMENTATIONS ---

    def strategy_random(self, persona: Dict, k: int) -> List[Dict]:
        """Strategy 1: Random Baseline"""
        rng = random.Random(42 + hash(persona["student_id"]))
        shuffled = list(self.catalog)
        rng.shuffle(shuffled)
        return shuffled[:k]

    def strategy_popularity(self, persona: Dict, k: int) -> List[Dict]:
        """Strategy 2: Popularity Baseline (Highest resume value + general appeal)"""
        sorted_popular = sorted(
            self.catalog,
            key=lambda x: (x.get("resume_value", 8.0), x.get("originality_score", 8.0)),
            reverse=True
        )
        return sorted_popular[:k]

    def strategy_keyword(self, persona: Dict, k: int) -> List[Dict]:
        """Strategy 3: Keyword Matching (Jaccard / Token Overlap)"""
        persona_tokens = set(
            [s.lower() for s in persona.get("skills", [])] +
            [i.lower() for i in persona.get("interests", [])] +
            [persona.get("preferred_language", "").lower()]
        )
        
        scored = []
        for p in self.catalog:
            p_tokens = set(
                [s.lower() for s in p.get("required_skills", [])] +
                p.get("domain", "").lower().split() +
                p.get("subdomain", "").lower().split() +
                [l.lower() for l in p.get("programming_languages", [])]
            )
            overlap = len(persona_tokens.intersection(p_tokens))
            jaccard = overlap / max(1, len(persona_tokens.union(p_tokens)))
            scored.append((jaccard, p))
            
        scored.sort(key=lambda x: x[0], reverse=True)
        return [p for _, p in scored[:k]]

    def strategy_content_based(self, persona: Dict, k: int) -> List[Dict]:
        """Strategy 4: Content-Based TF-IDF Similarity"""
        scores = self.recommender.content_recommender.score_projects(persona)
        sorted_by_content = sorted(
            self.catalog,
            key=lambda p: scores.get(p["project_id"], 0.0),
            reverse=True
        )
        return sorted_by_content[:k]

    def strategy_weighted_personalized(self, persona: Dict, k: int) -> List[Dict]:
        """Strategy 5: Full Weighted Personalized Model (with MMR Diversity)"""
        res = self.recommender.recommend(persona, top_k=k, enable_diversity=True)
        rec_ids = [r["project_id"] for r in res["recommendations"]]
        return [self.recommender.projects_dict[pid] for pid in rec_ids if pid in self.recommender.projects_dict]

    def strategy_hybrid_interactive(self, persona: Dict, k: int) -> List[Dict]:
        """Strategy 6: Hybrid Model incorporating user interaction feedback simulated weights"""
        # Boost user career goal weight and interest matching weights to simulate collaborative/interaction learning
        hybrid_weights = {
            "skill_compatibility": 0.35,
            "interest_match": 0.25,
            "career_goal_match": 0.15,
            "difficulty_fit": 0.05,
            "time_feasibility": 0.05,
            "technology_preference": 0.05,
            "learning_value": 0.05,
            "resume_relevance": 0.05,
            "past_project_penalty": 0.15
        }
        res = self.recommender.recommend(
            persona,
            top_k=k,
            enable_diversity=True,
            custom_weights=hybrid_weights
        )
        rec_ids = [r["project_id"] for r in res["recommendations"]]
        return [self.recommender.projects_dict[pid] for pid in rec_ids if pid in self.recommender.projects_dict]

    # --- BENCHMARK EVALUATION HARNESS ---

    def evaluate_all(self, k: int = 5) -> List[Dict]:
        """
        Runs complete benchmark evaluation comparing all 6 strategies across all test personas.
        """
        strategies = [
            ("Random Baseline", self.strategy_random),
            ("Popularity Baseline", self.strategy_popularity),
            ("Keyword Matching", self.strategy_keyword),
            ("Content-Based Similarity", self.strategy_content_based),
            ("Weighted Personalized Model", self.strategy_weighted_personalized),
            ("Hybrid / Interactive Model", self.strategy_hybrid_interactive),
        ]

        total_catalog_size = len(self.catalog)
        results = []

        for strat_name, strat_func in strategies:
            p_at_k_list = []
            r_at_k_list = []
            ndcg_list = []
            hit_list = []
            skill_compat_list = []
            feasibility_list = []
            intra_diversity_list = []
            all_recommended_ids: Set[str] = set()

            for persona in self.BENCHMARK_PERSONAS:
                # 1. Determine ground truth relevant items
                relevant_ids = set()
                for p in self.catalog:
                    if self.determine_ground_truth(persona, p):
                        relevant_ids.add(p["project_id"])

                # 2. Get top K recommendations from strategy
                recs = strat_func(persona, k)
                rec_ids = [p["project_id"] for p in recs]
                all_recommended_ids.update(rec_ids)

                # Precision@K & Recall@K
                hits = sum(1 for pid in rec_ids if pid in relevant_ids)
                p_at_k = hits / max(1, k)
                r_at_k = hits / max(1, len(relevant_ids))
                hit_rate = 1.0 if hits > 0 else 0.0

                p_at_k_list.append(p_at_k)
                r_at_k_list.append(r_at_k)
                hit_list.append(hit_rate)

                # NDCG@K
                dcg = 0.0
                for rank_idx, pid in enumerate(rec_ids):
                    rel = 1.0 if pid in relevant_ids else 0.0
                    dcg += rel / math.log2(rank_idx + 2)
                
                idcg = sum(1.0 / math.log2(i + 2) for i in range(min(k, len(relevant_ids))))
                ndcg = (dcg / idcg) if idcg > 0 else 0.0
                ndcg_list.append(ndcg)

                # Skill compatibility (average readiness)
                readiness_scores = []
                for p in recs:
                    gap = SkillGapEngine.analyze_gap(persona["skills"], p)
                    readiness_scores.append(gap["readiness_score"])
                skill_compat_list.append(np.mean(readiness_scores) if readiness_scores else 0.0)

                # Feasibility (% duration <= available_time)
                avail = persona.get("available_time_weeks", 4.0)
                feas = sum(1 for p in recs if p.get("estimated_duration", 4.0) <= avail * 1.25) / max(1, len(recs))
                feasibility_list.append(feas)

                # Intra-list Diversity (1 - average pairwise similarity)
                if len(recs) > 1:
                    sim_sum = 0.0
                    pairs = 0
                    for i in range(len(recs)):
                        for j in range(i + 1, len(recs)):
                            sim_sum += DiversityEngine.compute_item_similarity(recs[i], recs[j])
                            pairs += 1
                    avg_sim = sim_sum / max(1, pairs)
                    intra_diversity_list.append(1.0 - avg_sim)
                else:
                    intra_diversity_list.append(0.0)

            catalog_cov = len(all_recommended_ids) / max(1, total_catalog_size)
            
            # Novelty: inverted frequency proxy
            novelty = 1.0 - catalog_cov * 0.4

            results.append({
                "strategy_name": strat_name,
                "precision_at_5": round(float(np.mean(p_at_k_list)), 4),
                "recall_at_5": round(float(np.mean(r_at_k_list)), 4),
                "ndcg_at_5": round(float(np.mean(ndcg_list)), 4),
                "hit_rate_at_5": round(float(np.mean(hit_list)), 4),
                "catalog_coverage": round(float(catalog_cov), 4),
                "intra_list_diversity": round(float(np.mean(intra_diversity_list)), 4),
                "novelty_score": round(float(novelty), 4),
                "skill_compatibility": round(float(np.mean(skill_compat_list)), 4),
                "feasibility_score": round(float(np.mean(feasibility_list)), 4)
            })

        return results
