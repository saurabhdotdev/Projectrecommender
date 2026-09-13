"""
Stage 1: Content-Based Recommender Engine for ProjectForge.
Calculates initial baseline relevance scores using TF-IDF vector space
and semantic cosine similarity.
"""

from typing import List, Dict
import numpy as np
from .preprocessor import FeaturePreprocessor

class ContentRecommender:
    def __init__(self, preprocessor: FeaturePreprocessor):
        self.preprocessor = preprocessor

    def score_projects(self, student_profile: Dict) -> Dict[str, float]:
        """
        Returns a dictionary mapping project_id -> content_similarity_score (0.0 to 1.0).
        """
        student_vec = self.preprocessor.transform_student(student_profile)
        sims = self.preprocessor.compute_content_similarity(student_vec)
        
        scores: Dict[str, float] = {}
        for pid, sim in zip(self.preprocessor.project_ids, sims):
            # Normalize to 0.0 - 1.0 range
            scores[pid] = max(0.0, min(1.0, float(sim)))
            
        return scores
