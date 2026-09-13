import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, engine, Base
from app.api.routes_ai import (
    MockInterviewEvalRequest,
    MockInterviewSummaryRequest,
    MockInterviewRoundResult,
    post_mock_interview_evaluate,
    post_mock_interview_summary
)
from app.services.groq_service import (
    evaluate_mock_interview_answer,
    fallback_evaluate_mock_interview,
    generate_mock_interview_summary,
    fallback_interview_summary
)

class TestMockInterviewer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def setUp(self):
        self.mock_project = {
            "title": "Distributed Real-Time Log Analyzer",
            "domain": "Cloud & Distributed Systems",
            "required_skills": ["Go", "Kafka", "ClickHouse", "Docker"]
        }
        self.question = "How would you handle backpressure when Kafka ingestion spikes by 10x?"
        self.category = "System Architecture & Scalability"
        self.model_answer = "Implement reactive streams with buffer pools and rate-limiting consumers."
        self.key_tradeoffs = ["Throughput vs Latency", "Memory footprint vs Disk spooling"]

    def test_empty_student_answer_evaluation(self):
        """Test that submitting an empty answer returns a constructive low score with coaching."""
        res = evaluate_mock_interview_answer(
            project=self.mock_project,
            question=self.question,
            category=self.category,
            model_answer=self.model_answer,
            key_tradeoffs="; ".join(self.key_tradeoffs),
            student_answer="",
            interviewer_style="bar_raiser"
        )
        self.assertIn("overall_score", res)
        self.assertEqual(res["overall_score"], 1)
        self.assertIn("No answer was provided", res["feedback"])
        self.assertTrue(len(res["improvements"]) > 0)
        self.assertEqual(res["exemplar_revision"], self.model_answer)

    def test_fallback_evaluate_mock_interview(self):
        """Test that deterministic fallback evaluation scores based on length and technical keywords."""
        answer = "I would scale Kafka consumers using Kubernetes HPA, monitor lag metrics via Prometheus, and throttle upstream if queues reach 80% capacity."
        res = fallback_evaluate_mock_interview(
            project=self.mock_project,
            question=self.question,
            category=self.category,
            model_answer=self.model_answer,
            key_tradeoffs="; ".join(self.key_tradeoffs),
            student_answer=answer,
            interviewer_style="startup_cto"
        )
        self.assertIn("overall_score", res)
        self.assertTrue(1 <= res["overall_score"] <= 10)
        self.assertTrue(1 <= res["star_score"] <= 10)
        self.assertTrue(1 <= res["technical_depth_score"] <= 10)
        self.assertTrue(1 <= res["clarity_score"] <= 10)
        self.assertTrue(len(res["strengths"]) > 0)
        self.assertTrue(len(res["improvements"]) > 0)
        self.assertTrue(len(res["exemplar_revision"]) > 0)

    def test_fallback_interview_summary(self):
        """Test that summary debrief correctly assigns hire decision based on average score."""
        evals_high = [
            {"overall_score": 9, "category": "Arch", "feedback": "Great"},
            {"overall_score": 8, "category": "Scale", "feedback": "Solid"}
        ]
        summary_high = fallback_interview_summary("Distributed Log Analyzer", evals_high)
        self.assertIn("Strong Hire", summary_high["final_decision"])
        self.assertGreaterEqual(summary_high["average_score"], 8.5)
        self.assertTrue(len(summary_high["key_takeaways"]) >= 2)

        evals_low = [
            {"overall_score": 3, "category": "Arch", "feedback": "Struggled"},
            {"overall_score": 4, "category": "Scale", "feedback": "Vague"}
        ]
        summary_low = fallback_interview_summary("Distributed Log Analyzer", evals_low)
        self.assertIn("Needs Practice", summary_low["final_decision"])
        self.assertLess(summary_low["average_score"], 5.5)

    def test_api_route_mock_interview_evaluate(self):
        """Test API endpoint handler with key_tradeoffs as a list and string."""
        req = MockInterviewEvalRequest(
            project_title=self.mock_project["title"],
            project_domain=self.mock_project["domain"],
            required_skills=self.mock_project["required_skills"],
            question=self.question,
            category=self.category,
            model_answer=self.model_answer,
            key_tradeoffs=self.key_tradeoffs,
            student_answer="We partition our consumers and leverage disk spooling to decouple ingest rates from persistence latency.",
            interviewer_style="supportive_mentor"
        )
        res = post_mock_interview_evaluate(req, db=self.db)
        self.assertTrue(hasattr(res, "__getitem__") or hasattr(res, "overall_score"))
        score = res["overall_score"] if isinstance(res, dict) else res.overall_score
        self.assertTrue(1 <= score <= 10)

    def test_api_route_mock_interview_summary(self):
        """Test API endpoint handler for interview summary."""
        req = MockInterviewSummaryRequest(
            project_title="Distributed Real-Time Log Analyzer",
            evaluations=[
                MockInterviewRoundResult(
                    category="System Architecture",
                    question="How do you handle backpressure?",
                    student_answer="Using consumer group autoscaling and disk buffer spooling.",
                    overall_score=8,
                    feedback="Strong answer addressing horizontal scale."
                ),
                MockInterviewRoundResult(
                    category="Reliability",
                    question="How do you guarantee exactly-once semantics?",
                    student_answer="Using transactional producers and idempotent topic writes.",
                    overall_score=7,
                    feedback="Understands idempotency and Kafka transactional protocol."
                )
            ]
        )
        summary = post_mock_interview_summary(req)
        decision = summary["final_decision"] if isinstance(summary, dict) else summary.final_decision
        avg_score = summary["average_score"] if isinstance(summary, dict) else summary.average_score
        self.assertIn("Hire", decision)
        self.assertGreaterEqual(avg_score, 7.0)

if __name__ == "__main__":
    unittest.main()
