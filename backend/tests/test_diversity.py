import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.engine.diversity import DiversityEngine

class TestDiversityEngine(unittest.TestCase):
    def test_pairwise_similarity(self):
        p1 = {
            "domain": "HealthTech & BioInformatics",
            "subdomain": "Clinical Analytics",
            "required_skills": ["Python", "SQL", "Pandas"]
        }
        p2 = {
            "domain": "HealthTech & BioInformatics",
            "subdomain": "Clinical Analytics",
            "required_skills": ["Python", "SQL", "Pandas"]
        }
        p3 = {
            "domain": "Cybersecurity",
            "subdomain": "Network Security",
            "required_skills": ["Linux", "Wireshark", "C++"]
        }

        # Identical items should have similarity 1.0
        sim_identical = DiversityEngine.compute_item_similarity(p1, p2)
        self.assertAlmostEqual(sim_identical, 1.0, places=2)

        # Disjoint items should have similarity 0.0
        sim_disjoint = DiversityEngine.compute_item_similarity(p1, p3)
        self.assertAlmostEqual(sim_disjoint, 0.0, places=2)

    def test_mmr_diversification(self):
        # 5 identical health items and 2 distinct security items
        candidates = [
            {"project_id": f"h{i}", "domain": "HealthTech", "subdomain": "Clinical", "required_skills": ["Python", "Pandas"], "score": 0.90 - i * 0.01}
            for i in range(5)
        ] + [
            {"project_id": f"s{j}", "domain": "Cybersecurity", "subdomain": "Network", "required_skills": ["Linux", "Wireshark"], "score": 0.82 - j * 0.01}
            for j in range(2)
        ]

        # With MMR and domain capping, security items must be surfaced rather than only health items
        reranked = DiversityEngine.apply_mmr(candidates, top_k=4, lambda_param=0.6, max_per_domain=2)
        domains = [r["domain"] for r in reranked]
        self.assertIn("Cybersecurity", domains)
        self.assertLessEqual(domains.count("HealthTech"), 2)

if __name__ == "__main__":
    unittest.main()
