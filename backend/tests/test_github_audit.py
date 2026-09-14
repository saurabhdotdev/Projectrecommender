import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, engine, Base
from app.api.routes_projects import (
    GitHubAuditRequest,
    get_user_github_repos,
    post_github_audit
)
from app.services.github_audit_service import (
    parse_github_url,
    fetch_user_repositories,
    inspect_repository_tree,
    audit_github_repository
)

class TestGitHubAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_parse_github_url(self):
        """Test URL parsing for various valid and edge-case formats."""
        res1 = parse_github_url("https://github.com/fastapi/fastapi")
        self.assertIsNotNone(res1)
        self.assertEqual(res1["owner"], "fastapi")
        self.assertEqual(res1["repo"], "fastapi")

        res2 = parse_github_url("github.com/pallets/flask.git")
        self.assertIsNotNone(res2)
        self.assertEqual(res2["owner"], "pallets")
        self.assertEqual(res2["repo"], "flask")

        res3 = parse_github_url("octocat/Hello-World")
        self.assertIsNotNone(res3)
        self.assertEqual(res3["owner"], "octocat")
        self.assertEqual(res3["repo"], "Hello-World")

    def test_fetch_user_repositories(self):
        """Test fetching repositories for any user."""
        repos = fetch_user_repositories("octocat")
        self.assertIsInstance(repos, list)
        self.assertGreater(len(repos), 0)
        first = repos[0]
        self.assertIn("name", first)
        self.assertIn("html_url", first)
        self.assertIn("language", first)

    def test_audit_github_repository_structure(self):
        """Test auditing a repo returns comprehensive scores, letter grade, and PR blueprints."""
        res = audit_github_repository("https://github.com/fastapi/fastapi")
        self.assertIn("overall_score", res)
        self.assertTrue(1 <= res["overall_score"] <= 100)
        self.assertIn("letter_grade", res)
        self.assertIn(res["letter_grade"], ["A+", "A", "B+", "B", "C+", "C", "Needs Work"])
        self.assertIn("recruiter_impression", res)
        self.assertIn("assets", res)
        self.assertTrue(len(res["recommended_pull_requests"]) >= 2)
        pr1 = res["recommended_pull_requests"][0]
        self.assertIn("title", pr1)
        self.assertIn("rationale", pr1)

    def test_api_routes_github_audit(self):
        """Test FastAPI router endpoints for user repos and audit."""
        # 1. User repos endpoint
        repos = get_user_github_repos(username="octocat")
        self.assertIsInstance(repos, list)
        self.assertGreater(len(repos), 0)

        # 2. Audit endpoint
        req = GitHubAuditRequest(
            github_url="https://github.com/fastapi/fastapi",
            project_title="FastAPI"
        )
        audit_res = post_github_audit(req, db=self.db)
        score = audit_res["overall_score"] if isinstance(audit_res, dict) else audit_res.overall_score
        self.assertTrue(1 <= score <= 100)

if __name__ == "__main__":
    unittest.main()
