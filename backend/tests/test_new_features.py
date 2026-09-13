import unittest
import zipfile
import io
import json
from app.services.scaffold_generator import generate_project_scaffold_zip
from app.services.resume_parser import parse_resume_content, extract_skills_rule_based
from app.services.groq_service import generate_resume_interview_kit, fallback_resume_interview_kit
from app.database import SessionLocal, Base, engine
from app.models import User, UserProject, Project

class TestNewFeatures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_scaffold_generator_zip(self):
        """Tests that in-memory zip archive generation generates valid structure and files."""
        mock_proj = {
            "project_id": "test_ai_agent_01",
            "title": "Autonomous Edge Agent",
            "description": "An autonomous edge AI agent for sensor telemetry.",
            "domain": "Artificial Intelligence",
            "subdomain": "Edge AI",
            "difficulty": "Intermediate",
            "required_skills": ["Python", "FastAPI", "Docker", "PyTorch"],
            "programming_languages": ["Python"],
            "frameworks": ["FastAPI", "PyTorch"],
            "tools": ["Docker", "Git"],
            "learning_outcomes": ["Deploy edge models", "Containerize pipelines"],
            "estimated_duration": 4.0
        }
        zip_buf = generate_project_scaffold_zip(mock_proj, ["Python"])
        self.assertIsInstance(zip_buf, io.BytesIO)
        
        # Verify zip validity
        with zipfile.ZipFile(zip_buf, "r") as zf:
            namelist = zf.namelist()
            self.assertTrue(any(f.endswith("README.md") for f in namelist))
            self.assertTrue(any(f.endswith("requirements.txt") for f in namelist))
            self.assertTrue(any(f.endswith(".gitignore") for f in namelist))
            self.assertTrue(any(f.endswith("src/main.py") for f in namelist))
            self.assertTrue(any(f.endswith("src/utils.py") for f in namelist))
            self.assertTrue(any(f.endswith("tests/test_core.py") for f in namelist))
            self.assertTrue(any(f.endswith("docs/architecture.md") for f in namelist))

            readme_entry = [f for f in namelist if f.endswith("README.md")][0]
            readme_content = zf.read(readme_entry).decode("utf-8")
            self.assertIn("Autonomous Edge Agent", readme_content)
            self.assertIn("FastAPI", readme_content)

    def test_resume_parser_rule_based(self):
        """Tests that resume parser correctly extracts technical skills and degree/year info."""
        sample_resume = """
        John Doe | john.doe@email.com
        Education: B.Tech in Computer Science and Engineering, 3rd year (Expected 2026)
        Technical Skills:
        - Languages: Python, JavaScript, TypeScript, C++, SQL
        - ML/AI: PyTorch, Scikit-Learn, Pandas, NumPy, Computer Vision
        - Tools & Cloud: Docker, Kubernetes, Git, PostgreSQL, FastAPI
        Experience:
        Software Engineering Intern seeking summer internship opportunities.
        """
        parsed = parse_resume_content(sample_resume)
        self.assertIn("Computer Science", parsed["degree"])
        self.assertEqual(parsed["year"], "3rd year")
        self.assertEqual(parsed["career_goal"], "Internship")
        
        skills = parsed["skills"]
        self.assertIn("Python", skills)
        self.assertIn("Docker", skills)
        self.assertIn("PyTorch", skills)
        self.assertIn("PostgreSQL", skills)
        self.assertIn("FastAPI", skills)
        self.assertGreaterEqual(len(skills), 6)

    def test_resume_interview_kit_generation(self):
        """Tests STAR bullets and technical interview prep kit structure."""
        mock_proj = {
            "title": "Real-time Defect Detection",
            "domain": "Computer Vision",
            "required_skills": ["Python", "OpenCV", "PyTorch", "FastAPI", "Docker"],
            "frameworks": ["PyTorch", "FastAPI"],
            "tools": ["Docker"],
            "description": "High-throughput industrial vision inspection pipeline."
        }
        mock_student = {
            "degree": "Computer Science",
            "career_goal": "Machine Learning Engineer"
        }
        kit = fallback_resume_interview_kit(mock_proj, mock_student)
        self.assertIn("star_bullets", kit)
        self.assertIn("interview_questions", kit)
        self.assertIn("elevator_pitch", kit)
        self.assertGreaterEqual(len(kit["star_bullets"]), 3)
        self.assertEqual(len(kit["interview_questions"]), 5)

        # Check STAR fields
        b = kit["star_bullets"][0]
        self.assertIn("bullet", b)
        self.assertIn("situation_task", b)
        self.assertIn("action", b)
        self.assertIn("result", b)

        # Check Question fields
        q = kit["interview_questions"][0]
        self.assertIn("question", q)
        self.assertIn("category", q)
        self.assertIn("model_answer", q)
        self.assertIn("key_tradeoffs", q)
        self.assertIn("gotchas_to_avoid", q)

    def test_user_project_tasks_and_github_fields(self):
        """Tests that UserProject model stores completed_tasks and github_url properly."""
        user = self.db.query(User).first()
        if not user:
            user = User(email="test_features@test.com", full_name="Feature Tester", hashed_password="pwd")
            self.db.add(user)
            self.db.commit()

        up = UserProject(
            user_id=user.id,
            project_id="test_proj_checklist_01",
            project_title="Test Checklist Project",
            completed_tasks_json=json.dumps(["w1-t0", "w1-t1", "w2-t0"]),
            github_url="https://github.com/tester/test-project"
        )
        self.db.add(up)
        self.db.commit()
        self.db.refresh(up)

        self.assertEqual(up.completed_tasks, ["w1-t0", "w1-t1", "w2-t0"])
        self.assertEqual(up.github_url, "https://github.com/tester/test-project")
        
        up_dict = up.to_dict()
        self.assertIn("completed_tasks", up_dict)
        self.assertIn("github_url", up_dict)

        # Clean up
        self.db.delete(up)
        self.db.commit()

if __name__ == '__main__':
    unittest.main()
