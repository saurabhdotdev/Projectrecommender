import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, engine, Base
from app.models import Project
from app.schemas import RecommendationRequest, StudentProfileSchema, FeedbackCreate, GenerateIdeasRequest
from app.api.routes_recommend import get_recommendations, get_recommender
from app.api.routes_projects import (
    list_projects,
    get_project,
    get_project_skill_gap,
    get_project_roadmap,
    post_generate_ideas
)
from app.api.routes_students import save_student_profile, get_student_profile
from app.api.routes_feedback import log_user_feedback, get_user_interaction_summary
from app.api.routes_evaluation import get_skill_taxonomy, evaluate_recommenders

class TestAPIComponentsDirect(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.recommender = get_recommender(cls.db)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_list_projects(self):
        projs = list_projects(limit=10, offset=0, db=self.db)
        self.assertEqual(len(projs), 10)
        self.assertIn("project_id", projs[0])
        self.assertIn("title", projs[0])

    def test_get_project_detail(self):
        first = list_projects(limit=1, offset=0, db=self.db)[0]
        pid = first["project_id"]
        detail = get_project(project_id=pid, db=self.db)
        self.assertEqual(detail["project_id"], pid)
        self.assertIn("required_skills", detail)
        self.assertIn("skill_importance", detail)

    def test_skill_gap_route(self):
        first = list_projects(limit=1, offset=0, db=self.db)[0]
        pid = first["project_id"]
        gap = get_project_skill_gap(project_id=pid, skills="Python,SQL", db=self.db)
        self.assertIn("readiness_score", gap)
        self.assertIn("matched_skills", gap)
        self.assertIn("missing_skills", gap)

    def test_roadmap_route(self):
        first = list_projects(limit=1, offset=0, db=self.db)[0]
        pid = first["project_id"]
        roadmap = get_project_roadmap(project_id=pid, skills="Python,SQL", weeks=4.0, db=self.db)
        self.assertIn("milestones", roadmap)
        self.assertTrue(len(roadmap["milestones"]) >= 2)

    def test_recommendation_route(self):
        req = RecommendationRequest(
            student_profile=StudentProfileSchema(
                student_id="direct_test_student",
                degree="Computer Science",
                year="2nd year",
                skills=["Python", "Pandas", "SQL", "Machine Learning"],
                interests=["AI", "Healthcare"],
                experience_level="Intermediate",
                available_time_weeks=4.0,
                career_goal="Internship",
                preferred_language="Python"
            ),
            top_k=5,
            enable_diversity=True
        )
        res = get_recommendations(req, self.recommender)
        self.assertEqual(len(res["recommendations"]), 5)
        self.assertIn("perspectives", res)
        self.assertIsNotNone(res["perspectives"]["best_match"])

    def test_student_profile_save_and_get(self):
        schema = StudentProfileSchema(
            student_id="student_direct_save",
            degree="Software Engineering",
            year="3rd year",
            skills=["JavaScript", "React"],
            interests=["Web Development"]
        )
        saved = save_student_profile(schema, self.db)
        self.assertEqual(saved["student_id"], "student_direct_save")

        retrieved = get_student_profile("student_direct_save", self.db)
        self.assertEqual(retrieved["degree"], "Software Engineering")

    def test_feedback_logging(self):
        first = list_projects(limit=1, offset=0, db=self.db)[0]
        pid = first["project_id"]
        fb = FeedbackCreate(
            student_id="student_direct_save",
            project_id=pid,
            event_type="bookmarked",
            rating=5.0,
            feedback_notes="Direct API test note"
        )
        res = log_user_feedback(fb, self.db)
        self.assertEqual(res["status"], "success")

        summary = get_user_interaction_summary("student_direct_save", self.db)
        self.assertTrue(summary["total_interactions"] >= 1)

    def test_taxonomy_route(self):
        tax = get_skill_taxonomy()
        self.assertIn("domains", tax)
        self.assertIn("difficulties", tax)
        self.assertIn("skills", tax)
        self.assertTrue(len(tax["skills"]) > 10)

    def test_generate_ideas_route(self):
        req = GenerateIdeasRequest(
            student_profile=StudentProfileSchema(
                degree="Robotics",
                skills=["Python", "ROS2", "C++"],
                available_time_weeks=4.0
            ),
            prompt="Autonomous Drone Obstacle Avoidance",
            count=2,
            save_to_catalog=False
        )
        res = post_generate_ideas(req, self.db)
        self.assertEqual(len(res["generated_projects"]), 2)
        self.assertIn("title", res["generated_projects"][0])
        self.assertIn("required_skills", res["generated_projects"][0])
        self.assertTrue(res["total_catalog_size"] > 0)


if __name__ == "__main__":
    unittest.main()
