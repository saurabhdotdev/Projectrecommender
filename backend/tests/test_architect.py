import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models import Project
from app.schemas import CustomProjectArchitectRequest, CustomProjectSaveRequest
from app.services.project_architect import architect_custom_project, fallback_architect_custom_project
from app.api.routes_projects import post_architect_custom_project, post_save_custom_project, get_project

class TestProjectArchitect(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_fallback_architect_custom_project(self):
        blueprint = fallback_architect_custom_project(
            idea_prompt='Real-time multi-camera object detection for traffic monitoring with YOLO and FastAPI',
            domain='Computer Vision',
            preferred_tech=['PyTorch', 'Docker'],
            timeline_weeks=6.0,
            student_profile={'skills': ['Python', 'OpenCV'], 'experience_level': 'Intermediate'}
        )
        self.assertIn('project_id', blueprint)
        self.assertTrue(blueprint['project_id'].startswith('custom_'))
        self.assertIn('title', blueprint)
        self.assertIn('customization_suggestions', blueprint)
        self.assertEqual(len(blueprint['customization_suggestions']), 3)
        self.assertIn('skill_gap', blueprint)
        self.assertIn('roadmap', blueprint)
        self.assertGreaterEqual(len(blueprint['required_skills']), 2)

    def test_architect_service_e2e(self):
        blueprint = architect_custom_project(
            idea_prompt='Automated financial report analyzer using LLM and vector database',
            domain='Natural Language Processing',
            preferred_tech=['Transformers', 'FastAPI'],
            timeline_weeks=4.0,
            student_profile={'skills': ['Python'], 'degree': 'Computer Science'}
        )
        self.assertIn('project_id', blueprint)
        self.assertIn('title', blueprint)
        self.assertIn('customization_suggestions', blueprint)
        self.assertIn('roadmap', blueprint)

    def test_post_architect_and_save_endpoint(self):
        req = CustomProjectArchitectRequest(
            idea_prompt='Autonomous drone path planning simulator with obstacle avoidance',
            domain='Robotics & Autonomous Systems',
            preferred_tech=['ROS', 'Python'],
            timeline_weeks=4.0,
            student_profile={'skills': ['Python', 'C++']}
        )
        blueprint = post_architect_custom_project(req, db=self.db)
        self.assertIn('project_id', blueprint)
        self.assertTrue(blueprint['project_id'].startswith('custom_'))

        # Save the architected project
        save_req = CustomProjectSaveRequest(
            project=blueprint,
            save_to_workspace=False
        )
        res = post_save_custom_project(save_req, db=self.db, current_user=None)
        self.assertTrue(res['saved'])

        # Fetch it back from db
        fetched = get_project(project_id=blueprint['project_id'], db=self.db)
        self.assertEqual(fetched['project_id'], blueprint['project_id'])
        self.assertEqual(fetched['title'], blueprint['title'])

if __name__ == '__main__':
    unittest.main()
