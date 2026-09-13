"""
Diversity and Anti-Repetition Engine for ProjectForge.
Implements:
1. Maximal Marginal Relevance (MMR) ranking
2. Inter-item pairwise similarity (Skills + Subdomain + TF-IDF)
3. Domain diversification constraints
"""

from typing import List, Dict, Set
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class DiversityEngine:
    @staticmethod
    def compute_item_similarity(p1: Dict, p2: Dict) -> float:
        """
        Computes pairwise similarity between two projects based on:
        - Domain/subdomain overlap
        - Required skills Jaccard index
        """
        # Domain similarity
        if p1.get("subdomain") == p2.get("subdomain"):
            domain_sim = 1.0
        elif p1.get("domain") == p2.get("domain"):
            domain_sim = 0.60
        else:
            domain_sim = 0.0

        # Skills Jaccard index
        s1 = set(p1.get("required_skills", []))
        s2 = set(p2.get("required_skills", []))
        union = s1.union(s2)
        skill_jaccard = len(s1.intersection(s2)) / max(1, len(union))

        return 0.55 * domain_sim + 0.45 * skill_jaccard

    @classmethod
    def apply_mmr(
        cls,
        candidate_items: List[Dict],
        top_k: int = 10,
        lambda_param: float = 0.70,
        max_per_domain: int = 3
    ) -> List[Dict]:
        """
        Reranks candidate items using Maximal Marginal Relevance (MMR).
        lambda_param balances relevance (1.0 = pure relevance) vs diversity (0.0 = maximal diversity).
        """
        if not candidate_items:
            return []

        selected: List[Dict] = []
        candidates = list(candidate_items)
        domain_counts: Dict[str, int] = {}

        # 1. Pick the top scoring item first
        first_item = candidates.pop(0)
        selected.append(first_item)
        domain_counts[first_item["domain"]] = 1

        # 2. Iteratively pick items that maximize MMR
        while len(selected) < top_k and candidates:
            best_mmr = -float("inf")
            best_idx = -1

            for idx, cand in enumerate(candidates):
                c_dom = cand.get("domain", "")
                # Soft penalty or filter if domain cap is reached
                if domain_counts.get(c_dom, 0) >= max_per_domain:
                    domain_penalty = 0.25
                else:
                    domain_penalty = 0.0

                rel_score = cand["score"]
                
                # Max similarity to any already selected item
                max_sim = max(cls.compute_item_similarity(cand, s) for s in selected)
                
                # MMR formula: lambda * Relevance - (1 - lambda) * MaxSimilarity - domain_penalty
                mmr_score = (lambda_param * rel_score) - ((1.0 - lambda_param) * max_sim) - domain_penalty

                if mmr_score > best_mmr:
                    best_mmr = mmr_score
                    best_idx = idx

            if best_idx >= 0:
                chosen = candidates.pop(best_idx)
                selected.append(chosen)
                domain_counts[chosen["domain"]] = domain_counts.get(chosen["domain"], 0) + 1
            else:
                break

        return selected
