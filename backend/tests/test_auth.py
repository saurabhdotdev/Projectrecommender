import unittest
import sys
import os
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import User, UserProject, Project
from app.schemas import UserRegisterRequest, UserLoginRequest, UserProjectCreate, UserProjectUpdate
from app.api.routes_auth import (
    register_user,
    login_user,
    add_or_update_user_project,
    get_user_projects,
    update_user_project_status,
    remove_user_project,
    sync_local_projects
)

class TestAuthAndWorkspace(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        # Create a sample project if needed
        cls.sample_pid = f"test-proj-{uuid.uuid4().hex[:6]}"
        proj = Project(
            project_id=cls.sample_pid,
            title="Test Authentication Workspace Project",
            description="Testing workspace features",
            domain="Computer Science",
            subdomain="Software Engineering",
            difficulty="Intermediate",
            required_skills_json='["Python", "FastAPI"]',
            skill_importance_json='{"Python": 1.0}',
            programming_languages_json='["Python"]',
            frameworks_json='["FastAPI"]',
            tools_json='["Docker"]',
            prerequisites_json='["Python"]',
            career_paths_json='["Software Engineer"]',
            learning_outcomes_json='["Built auth system"]',
            estimated_duration=4.0
        )
        cls.db.add(proj)
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        # Cleanup
        cls.db.query(UserProject).filter(UserProject.project_id == cls.sample_pid).delete()
        cls.db.query(Project).filter(Project.project_id == cls.sample_pid).delete()
        cls.db.commit()
        cls.db.close()

    def test_register_and_login_flow(self):
        unique_email = f"student_{uuid.uuid4().hex[:8]}@example.com"
        reg_req = UserRegisterRequest(
            email=unique_email,
            password="securePassword123",
            full_name="Alex River"
        )
        reg_res = register_user(reg_req, db=self.db)
        self.assertEqual(reg_res["user"]["email"], unique_email)
        self.assertEqual(reg_res["user"]["full_name"], "Alex River")
        self.assertTrue(len(reg_res["token"]) > 20)

        # Login with same credentials
        login_req = UserLoginRequest(email=unique_email, password="securePassword123")
        login_res = login_user(login_req, db=self.db)
        self.assertEqual(login_res["user"]["id"], reg_res["user"]["id"])
        self.assertTrue(len(login_res["token"]) > 20)

    def test_user_project_start_and_update(self):
        unique_email = f"workspace_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = register_user(UserRegisterRequest(email=unique_email, password="pass", full_name="Worker"), db=self.db)
        user_obj = self.db.query(User).filter(User.id == reg_res["user"]["id"]).first()

        # Start project
        add_req = UserProjectCreate(project_id=self.sample_pid, status="started")
        added = add_or_update_user_project(add_req, current_user=user_obj, db=self.db)
        self.assertEqual(added["project_id"], self.sample_pid)
        self.assertEqual(added["status"], "started")
        self.assertEqual(added["project_title"], "Test Authentication Workspace Project")

        # Get user projects
        projects = get_user_projects(status=None, current_user=user_obj, db=self.db)
        self.assertEqual(len(projects), 1)
        self.assertEqual(projects[0]["project_id"], self.sample_pid)

        # Update status to completed
        updated = update_user_project_status(
            project_id=self.sample_pid,
            req=UserProjectUpdate(status="completed", progress_notes="Finished successfully"),
            current_user=user_obj,
            db=self.db
        )
        self.assertEqual(updated["status"], "completed")
        self.assertEqual(updated["progress_notes"], "Finished successfully")

        # Delete project
        removed = remove_user_project(project_id=self.sample_pid, current_user=user_obj, db=self.db)
        self.assertEqual(removed["status"], "removed")

        # Confirm deleted
        after_del = get_user_projects(status=None, current_user=user_obj, db=self.db)
        self.assertEqual(len(after_del), 0)

    def test_sync_local_projects(self):
        unique_email = f"sync_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = register_user(UserRegisterRequest(email=unique_email, password="pass", full_name="Syncer"), db=self.db)
        user_obj = self.db.query(User).filter(User.id == reg_res["user"]["id"]).first()

        local_items = [UserProjectCreate(project_id=self.sample_pid, status="started")]
        synced = sync_local_projects(local_items, current_user=user_obj, db=self.db)
        self.assertTrue(len(synced) >= 1)
        self.assertEqual(synced[0]["project_id"], self.sample_pid)

if __name__ == "__main__":
    unittest.main()
