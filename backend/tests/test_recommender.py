import unittest
import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.engine.recommender import ProjectForgeRecommender

class TestRecommenderEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data_path = os.path.join(os.path.dirname(__file__), "..", "app", "data", "projects_dataset.json")
        with open(data_path, "r", encoding="utf-8") as f:
            cls.projects = json.load(f)
        cls.recommender = ProjectForgeRecommender(cls.projects)

    def test_recommendation_output_structure(self):
        student = {
            "student_id": "test_student_1",
            "degree": "Computer Science",
            "year": "2nd year",
            "skills": ["Python", "Pandas", "SQL", "Machine Learning"],
            "interests": ["AI", "Healthcare"],
            "experience_level": "Intermediate",
            "available_time_weeks": 4.0,
            "career_goal": "Internship",
            "preferred_language": "Python"
        }

        res = self.recommender.recommend(student, top_k=5)
        self.assertIn("recommendations", res)
        self.assertIn("perspectives", res)
        self.assertEqual(len(res["recommendations"]), 5)

        first = res["recommendations"][0]
        self.assertIn("project_id", first)
        self.assertIn("title", first)
        self.assertIn("score", first)
        self.assertIn("match_percentage", first)
        self.assertIn("readiness", first)
        self.assertIn("readiness_percentage", first)
        self.assertIn("matched_skills", first)
        self.assertIn("missing_skills", first)
        self.assertIn("reasons", first)
        self.assertIn("cautions", first)

        # Perspectives must contain all 5 key categories
        persp = res["perspectives"]
        self.assertIsNotNone(persp["best_match"])
        self.assertIsNotNone(persp["best_learning_opportunity"])
        self.assertIsNotNone(persp["best_resume_project"])
        self.assertIsNotNone(persp["quick_win"])
        self.assertIsNotNone(persp["stretch_project"])

    def test_cold_start_new_student(self):
        # Even with minimal empty profile, recommendations must work gracefully without crashing
        new_student = {
            "skills": [],
            "interests": [],
            "available_time_weeks": 4.0
        }
        res = self.recommender.recommend(new_student, top_k=5)
        self.assertEqual(len(res["recommendations"]), 5)
        self.assertTrue(all(r["score"] > 0 for r in res["recommendations"]))

if __name__ == "__main__":
    unittest.main()
