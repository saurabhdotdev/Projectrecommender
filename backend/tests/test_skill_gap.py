import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.engine.skill_gap import SkillGapEngine
from app.engine.taxonomy import normalize_skill_name

class TestSkillGapEngine(unittest.TestCase):
    def setUp(self):
        self.mock_project = {
            "project_id": "test-p1",
            "title": "Hospital Readmission Prediction",
            "required_skills": ["Python", "Pandas", "Machine Learning", "SQL", "FastAPI", "Docker"],
            "skill_importance": {
                "Python": 0.25,
                "Pandas": 0.20,
                "Machine Learning": 0.25,
                "SQL": 0.15,
                "FastAPI": 0.10,
                "Docker": 0.05
            }
        }

    def test_full_skill_match(self):
        student_skills = ["Python", "Pandas", "Machine Learning", "SQL", "FastAPI", "Docker"]
        gap = SkillGapEngine.analyze_gap(student_skills, self.mock_project)
        self.assertEqual(gap["readiness_score"], 1.0)
        self.assertEqual(gap["readiness_percentage"], 100)
        self.assertEqual(len(gap["missing_skills"]), 0)
        self.assertEqual(gap["total_prep_hours"], 0)

    def test_partial_skill_match(self):
        student_skills = ["Python", "Pandas", "SQL", "Machine Learning"]
        gap = SkillGapEngine.analyze_gap(student_skills, self.mock_project)
        # Missing FastAPI (0.10) and Docker (0.05) -> possessed sum = 0.85
        self.assertAlmostEqual(gap["readiness_score"], 0.85, places=2)
        self.assertEqual(gap["readiness_percentage"], 85)
        self.assertIn("FastAPI", gap["missing_skill_names"])
        self.assertIn("Docker", gap["missing_skill_names"])
        self.assertTrue(gap["total_prep_hours"] > 0)

    def test_zero_skill_match(self):
        student_skills = ["Java", "Rust"]
        gap = SkillGapEngine.analyze_gap(student_skills, self.mock_project)
        self.assertEqual(gap["readiness_score"], 0.0)
        self.assertEqual(len(gap["matched_skills"]), 0)
        self.assertEqual(len(gap["missing_skills"]), 6)

    def test_skill_alias_normalization(self):
        # "ml" and "py" and "postgres" should normalize and match
        norm_py = normalize_skill_name("py")
        norm_ml = normalize_skill_name("machine-learning")
        self.assertEqual(norm_py, "Python")
        self.assertEqual(norm_ml, "Machine Learning")

if __name__ == "__main__":
    unittest.main()
