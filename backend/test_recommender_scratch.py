import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.engine.recommender import ProjectForgeRecommender
from app.engine.roadmap_generator import RoadmapGenerator

data_path = os.path.join(os.path.dirname(__file__), "app", "data", "projects_dataset.json")
with open(data_path, "r", encoding="utf-8") as f:
    projects = json.load(f)

recommender = ProjectForgeRecommender(projects)

student = {
    "student_id": "cs_2nd_year_health",
    "degree": "Computer Science",
    "year": "2nd year",
    "skills": ["Python", "SQL", "Pandas", "basic Machine Learning"],
    "interests": ["AI", "Healthcare"],
    "experience_level": "Intermediate",
    "available_time_weeks": 4.0,
    "career_goal": "Internship",
    "preferred_language": "Python"
}

results = recommender.recommend(student, top_k=5)
print("=" * 60)
print(f"Recommender Execution Time: {results['execution_time_ms']} ms")
print("=" * 60)

for i, r in enumerate(results["recommendations"], 1):
    print(f"\n{i}. {r['title']} [Match: {r['match_percentage']}% | Readiness: {r['readiness_percentage']}%]")
    print(f"   Domain: {r['domain']} | Difficulty: {r['difficulty']} | Duration: {r['estimated_duration']} weeks")
    print(f"   Matched Skills: {r['matched_skills']}")
    print(f"   Missing Skills: {r['missing_skills']}")
    print(f"   Reasons: {r['reasons']}")
    if r['cautions']:
        print(f"   Cautions: {r['cautions']}")

print("\n" + "=" * 60)
print("Hospital Readmission Inspection:")
print("=" * 60)
for idx, p in enumerate(recommender.recommend(student, top_k=60, enable_diversity=False)["recommendations"], 1):
    if "Hospital Readmission" in p["title"]:
        print(f"Rank {idx}: {p['title']}")
        print(f"Score: {p['score']} (Match: {p['match_percentage']}%)")
        print(f"Readiness: {p['readiness_percentage']}%")
        print(f"Components: {p['score_components']}")
        print(f"Matched Skills: {p['matched_skills']}")
        print(f"Missing Skills: {p['missing_skills']}")
        break

# Roadmap check
top_project = results["recommendations"][0]
proj_dict = recommender.projects_dict[top_project["project_id"]]
roadmap = RoadmapGenerator.generate_roadmap(student["skills"], proj_dict, student["available_time_weeks"])
print("\n" + "=" * 60)
print(f"Adaptive Roadmap for '{top_project['title']}':")
print(f"Adjustment Note: {roadmap['readiness_adjustment_note']}")
for m in roadmap["milestones"]:
    print(f"  Week {m['week_number']}: {m['title']}")
    print(f"    Deliverables: {m['deliverables']}")
