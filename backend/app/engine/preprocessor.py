"""
Feature Engineering and Preprocessor for ProjectForge.
Builds TF-IDF vector representations, categorical encodings, and numerical normalizations
for both project catalog records and student profiles.
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .taxonomy import normalize_skill_list, normalize_difficulty

class FeaturePreprocessor:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            max_features=1500,
            sublinear_tf=True
        )
        self.project_ids: List[str] = []
        self.project_features_matrix: Optional[np.ndarray] = None
        self.projects_cache: List[Dict] = []
        self.is_fitted: bool = False

    def _build_project_text(self, p: Dict) -> str:
        """
        Combines project textual metadata into a dense descriptive corpus string.
        """
        skills = " ".join(p.get("required_skills", []))
        domain = p.get("domain", "")
        subdomain = p.get("subdomain", "")
        title = p.get("title", "")
        desc = p.get("description", "")
        tools = " ".join(p.get("tools", []))
        frameworks = " ".join(p.get("frameworks", []))
        langs = " ".join(p.get("programming_languages", []))
        outcomes = " ".join(p.get("learning_outcomes", []))
        career = " ".join(p.get("career_paths", []))
        
        # Skill weighting repetition to emphasize skill matching in TF-IDF
        return f"{title} {title} {domain} {subdomain} {skills} {skills} {langs} {frameworks} {tools} {career} {desc} {outcomes}"

    def fit_projects(self, projects: List[Dict]):
        """
        Fits the TF-IDF vectorizer on all projects in the catalog.
        """
        self.projects_cache = projects
        self.project_ids = [p["project_id"] for p in projects]
        corpus = [self._build_project_text(p) for p in projects]
        self.project_features_matrix = self.vectorizer.fit_transform(corpus)
        self.is_fitted = True

    def build_student_text(self, profile: Dict) -> str:
        """
        Builds a rich textual representation of the student profile,
        expanding domain and interest synonyms for robust semantic TF-IDF overlap.
        """
        skills = " ".join(normalize_skill_list(profile.get("skills", [])))
        interests = profile.get("interests", [])
        
        # Semantic interest expansions
        expanded_interests = list(interests)
        for intr in interests:
            i_low = intr.lower()
            if any(k in i_low for k in ["health", "medic", "hospital", "clinic"]):
                expanded_interests.extend(["Healthcare", "HealthTech", "Clinical", "Medical", "Hospital", "BioInformatics"])
            if any(k in i_low for k in ["ai", "ml", "machine"]):
                expanded_interests.extend(["Artificial Intelligence", "Machine Learning", "Predictive", "Deep Learning"])
            if any(k in i_low for k in ["web", "front", "back", "fullstack"]):
                expanded_interests.extend(["Web Development", "Full Stack", "Frontend", "Backend"])
            if any(k in i_low for k in ["security", "cyber"]):
                expanded_interests.extend(["Cybersecurity", "Network Security", "Information Security"])
            if any(k in i_low for k in ["fin", "quant", "stock"]):
                expanded_interests.extend(["FinTech", "Quantitative", "Finance"])

        interests_str = " ".join(expanded_interests)
        degree = profile.get("degree", "")
        goal = profile.get("career_goal", "")
        pref_lang = profile.get("preferred_language", "")
        pref_tech = " ".join(profile.get("preferred_technologies", []))
        exp = profile.get("experience_level", "")
        
        return f"{skills} {skills} {interests_str} {interests_str} {goal} {pref_lang} {pref_tech} {degree} {exp}"

    def transform_student(self, profile: Dict):
        """
        Transforms student profile into the TF-IDF vector space.
        """
        if not self.is_fitted:
            raise ValueError("Preprocessor has not been fitted on project catalog.")
        student_text = self.build_student_text(profile)
        return self.vectorizer.transform([student_text])

    def compute_content_similarity(self, student_vector) -> np.ndarray:
        """
        Computes cosine similarity between student vector and all project vectors.
        """
        if not self.is_fitted:
            raise ValueError("Preprocessor not fitted.")
        sims = cosine_similarity(student_vector, self.project_features_matrix)
        return sims[0]
