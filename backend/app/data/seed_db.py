"""
Database Seeder and Data Quality Pipeline for ProjectForge.
Performs:
1. Missing-value analysis & schema validation
2. Duplicate detection (project_id & title)
3. Skill name normalization to canonical taxonomy
4. Categorical & duration standardization
5. Skill taxonomy catalog generation
6. SQLAlchemy database ingestion
"""

import json
import os
import sys
from collections import Counter
from typing import Dict, List, Set

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database import SessionLocal, engine, Base
from app.models import Project
from app.engine.taxonomy import (
    normalize_skill_name,
    normalize_skill_list,
    normalize_difficulty,
    normalize_duration,
    get_skill_metadata,
    VALID_DOMAINS,
    VALID_DIFFICULTIES
)

def run_data_quality_and_seed():
    print("=" * 70)
    print("ProjectForge Data Quality Pipeline & Database Seeding")
    print("=" * 70)

    # 1. Load raw dataset
    data_file = os.path.join(os.path.dirname(__file__), "projects_dataset.json")
    if not os.path.exists(data_file):
        raise FileNotFoundError(f"Project dataset not found at {data_file}")

    with open(data_file, "r", encoding="utf-8") as f:
        raw_projects = json.load(f)

    print(f"Loaded {len(raw_projects)} raw projects from {data_file}.")

    # 2. Missing Value Analysis
    missing_report = Counter()
    total_records = len(raw_projects)
    required_keys = [
        "project_id", "title", "description", "domain", "subdomain",
        "difficulty", "required_skills", "skill_importance", "estimated_duration"
    ]

    for proj in raw_projects:
        for k in required_keys:
            if k not in proj or proj[k] is None or proj[k] == "" or (isinstance(proj[k], list) and len(proj[k]) == 0):
                missing_report[k] += 1

    print("\n--- Missing Value Analysis ---")
    if missing_report:
        for field, count in missing_report.items():
            print(f"  Field '{field}': {count}/{total_records} missing ({count/total_records*100:.1f}%)")
    else:
        print("  [OK] Zero missing values detected across all core required fields.")

    # 3. Duplicate Detection
    seen_ids: Set[str] = set()
    seen_titles: Set[str] = set()
    duplicate_ids: List[str] = []
    duplicate_titles: List[str] = []

    cleaned_projects: List[Dict] = []
    for proj in raw_projects:
        pid = proj.get("project_id", "").strip()
        title = proj.get("title", "").strip()

        if pid in seen_ids:
            duplicate_ids.append(pid)
            continue
        if title.lower() in seen_titles:
            duplicate_titles.append(title)
            continue

        seen_ids.add(pid)
        seen_titles.add(title.lower())
        cleaned_projects.append(proj)

    print("\n--- Duplicate Detection ---")
    print(f"  Duplicate IDs found: {len(duplicate_ids)}")
    print(f"  Duplicate Titles found: {len(duplicate_titles)}")
    print(f"  Retained unique records: {len(cleaned_projects)}")

    # 4. Normalization & Taxonomy Aggregation
    skill_frequency = Counter()
    domain_distribution = Counter()
    difficulty_distribution = Counter()

    final_records: List[Dict] = []

    for p in cleaned_projects:
        # Normalize difficulty
        norm_difficulty = normalize_difficulty(p.get("difficulty", "Intermediate"))
        difficulty_distribution[norm_difficulty] += 1

        # Normalize domain
        raw_dom = p.get("domain", "").strip()
        norm_domain = raw_dom if raw_dom in VALID_DOMAINS else "Machine Learning"
        domain_distribution[norm_domain] += 1

        # Normalize duration
        norm_duration = normalize_duration(p.get("estimated_duration", 4.0))

        # Normalize required skills
        norm_skills = normalize_skill_list(p.get("required_skills", []))
        if not norm_skills:
            norm_skills = ["Python"]

        # Recalculate skill importance weights to align with canonical names
        raw_importance = p.get("skill_importance", {})
        norm_importance: Dict[str, float] = {}
        for sk in norm_skills:
            norm_importance[sk] = raw_importance.get(sk, round(1.0 / len(norm_skills), 2))
        
        # Ensure weights sum to 1.0
        tot_w = sum(norm_importance.values())
        if tot_w > 0:
            norm_importance = {k: round(v / tot_w, 3) for k, v in norm_importance.items()}

        for sk in norm_skills:
            skill_frequency[sk] += 1

        # Languages, frameworks, tools normalization
        norm_langs = normalize_skill_list(p.get("programming_languages", []))
        norm_frameworks = normalize_skill_list(p.get("frameworks", []))
        norm_tools = normalize_skill_list(p.get("tools", []))

        final_records.append({
            "project_id": p["project_id"],
            "title": p["title"].strip(),
            "description": p["description"].strip(),
            "domain": norm_domain,
            "subdomain": p.get("subdomain", "General").strip(),
            "difficulty": norm_difficulty,
            "required_skills": norm_skills,
            "skill_importance": norm_importance,
            "programming_languages": norm_langs if norm_langs else ["Python"],
            "frameworks": norm_frameworks,
            "tools": norm_tools if norm_tools else ["Git"],
            "prerequisites": p.get("prerequisites", []),
            "estimated_duration": norm_duration,
            "dataset_available": bool(p.get("dataset_available", False)),
            "dataset_source": p.get("dataset_source", ""),
            "project_type": p.get("project_type", "Applied Project"),
            "career_paths": p.get("career_paths", [f"{norm_domain} Engineer"]),
            "resume_value": float(p.get("resume_value", 8.0)),
            "originality_score": float(p.get("originality_score", 8.0)),
            "learning_outcomes": p.get("learning_outcomes", [])
        })

    print("\n--- Normalization Summary ---")
    print(f"  Domains covered ({len(domain_distribution)}): {dict(domain_distribution)}")
    print(f"  Difficulty distribution: {dict(difficulty_distribution)}")
    print(f"  Unique canonical skills in catalog: {len(skill_frequency)}")
    print(f"  Top 10 Most In-Demand Skills: {skill_frequency.most_common(10)}")

    # 5. Export Skill Taxonomy JSON
    taxonomy_export = []
    for skill_name, freq in skill_frequency.most_common():
        meta = get_skill_metadata(skill_name)
        taxonomy_export.append({
            "skill_name": skill_name,
            "category": meta["category"],
            "project_count": freq,
            "base_learning_hours": meta["base_learning_hours"],
            "prerequisites": meta["prereqs"]
        })

    taxonomy_file = os.path.join(os.path.dirname(__file__), "skill_taxonomy.json")
    with open(taxonomy_file, "w", encoding="utf-8") as f:
        json.dump(taxonomy_export, f, indent=2)
    print(f"  [OK] Exported skill taxonomy catalog with {len(taxonomy_export)} skills to {taxonomy_file}")

    # 6. Database Seeding via SQLAlchemy
    print("\n--- Database Seeding ---")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Clear existing projects
        db.query(Project).delete()
        db.commit()

        for rec in final_records:
            proj_obj = Project(
                project_id=rec["project_id"],
                title=rec["title"],
                description=rec["description"],
                domain=rec["domain"],
                subdomain=rec["subdomain"],
                difficulty=rec["difficulty"],
                required_skills_json=json.dumps(rec["required_skills"]),
                skill_importance_json=json.dumps(rec["skill_importance"]),
                programming_languages_json=json.dumps(rec["programming_languages"]),
                frameworks_json=json.dumps(rec["frameworks"]),
                tools_json=json.dumps(rec["tools"]),
                prerequisites_json=json.dumps(rec["prerequisites"]),
                estimated_duration=rec["estimated_duration"],
                dataset_available=rec["dataset_available"],
                dataset_source=rec["dataset_source"],
                project_type=rec["project_type"],
                career_paths_json=json.dumps(rec["career_paths"]),
                resume_value=rec["resume_value"],
                originality_score=rec["originality_score"],
                learning_outcomes_json=json.dumps(rec["learning_outcomes"])
            )
            db.add(proj_obj)

        db.commit()
        count = db.query(Project).count()
        print(f"  [OK] Successfully seeded {count} clean, validated project records into database.")
    except Exception as e:
        db.rollback()
        print(f"  [ERROR] Error during database seeding: {e}")
        raise e
    finally:
        db.close()

    print("\nData Quality Pipeline & Database Seeding Completed Successfully!\n")

if __name__ == "__main__":
    run_data_quality_and_seed()
