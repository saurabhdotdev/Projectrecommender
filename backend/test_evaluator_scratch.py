import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.engine.recommender import ProjectForgeRecommender
from app.engine.evaluator import RecommenderEvaluator

data_path = os.path.join(os.path.dirname(__file__), "app", "data", "projects_dataset.json")
with open(data_path, "r", encoding="utf-8") as f:
    projects = json.load(f)

recommender = ProjectForgeRecommender(projects)
evaluator = RecommenderEvaluator(recommender)

metrics = evaluator.evaluate_all(k=5)
print("=" * 90)
print(f"{'Strategy':<30} | {'P@5':<6} | {'R@5':<6} | {'NDCG@5':<7} | {'Coverage':<8} | {'Diversity':<9} | {'SkillCompat':<10}")
print("=" * 90)
for m in metrics:
    print(f"{m['strategy_name']:<30} | {m['precision_at_5']:<6.3f} | {m['recall_at_5']:<6.3f} | {m['ndcg_at_5']:<7.3f} | {m['catalog_coverage']:<8.3f} | {m['intra_list_diversity']:<9.3f} | {m['skill_compatibility']:<10.3f}")
print("=" * 90)
