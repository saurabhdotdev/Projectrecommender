# ProjectForge — Intelligent Student Project Recommendation & Skill-Gap System

> **Personal AI Project Advisor**: Recommends and ranks the most suitable capstone, internship, and portfolio projects for students using multi-factor personalized matching, skill-gap analysis, adaptive roadmaps, and explainable guidance.

---

## 🌟 The Problem & Solution

Students frequently struggle to decide what project to build. Existing project catalogs are static and fail to answer:
- *Is this project suitable for my current skills?*
- *Is it too easy or too difficult for me?*
- *Can I realistically finish it within my available time?*
- *What skills am I missing, and what should I learn first?*
- *Which project gives me the best balance of learning value, feasibility, and resume impact?*

**ProjectForge** acts as an **AI-powered project mentor**. Given a student's profile, it:
1. Performs **canonical skill taxonomy normalization** across aliases and abbreviations.
2. Computes **Stage 1 Content-Based TF-IDF semantic relevance**.
3. Calculates **Skill-Gap Intelligence** and an importance-weighted **Project Readiness Score**.
4. Applies **Stage 2 Multi-Factor Weighted Ranking** across 8 dimensions.
5. Employs **Maximal Marginal Relevance (MMR)** anti-repetition filtering to prevent domain monotony.
6. Slices recommendations into **5 distinct perspectives** (Best Match, Learning Opportunity, Resume Project, Quick Win, Stretch Project).
7. Generates transparent **"Why Recommended" explainability attributions**.
8. Produces **adaptive week-by-week personalized learning roadmaps** tailored to the student's exact missing skills.

---

## 🏛️ System Architecture

```text
                        Student Profile 
             (Skills, Proficiency, Interests, Schedule, Goal)
                                    │
                                    ▼
                         Taxonomy Normalizer
                  (Canonical Skill & Alias Mapping)
                                    │
                                    ▼
                      Feature Engineering Pipeline
                 (TF-IDF Sublinear N-Grams + Dense Sets)
                                    │
                                    ▼
     ┌─────────────────────────────────────────────────────────────┐
     │                    Recommendation Engine                    │
     │                                                             │
     │  Stage 1: Content-Based Semantic Relevance Vector Space     │
     │  Stage 2: Skill-Gap & Importance-Weighted Readiness Engine │
     │  Stage 3: Multi-Factor Weighted Personalization Function    │
     │  Stage 4: Multi-Perspective Classifier (Match/Learn/Resume) │
     └──────────────────────────────┬──────────────────────────────┘
                                    │
                                    ▼
                        Maximal Marginal Relevance
                          (MMR Diversity Filter)
                                    │
                                    ▼
                         Explainability & Roadmap
                     ("Why Recommended?" + Timeline)
                                    │
                                    ▼
                           FastAPI REST API
                                    │
                                    ▼
                     Modern Glassmorphic React UI
```

---

## 📐 Scoring Formula & Personalization Function

$$\text{Score}(P, S) = \sum_{i=1}^8 w_i \cdot \text{Factor}_i(P, S) - w_9 \cdot \text{Penalty}_{\text{past}}$$

| Factor | Default Weight | Description |
|---|:---:|---|
| **Skill Compatibility** | **0.30** | Weighted readiness score ($S_{\text{student}} \cap S_{\text{project}}$) blended with TF-IDF similarity. |
| **Interest Match** | **0.20** | Semantic domain/subdomain alignment with student interests. |
| **Career Goal Match** | **0.15** | Alignment with target role (Internship, Full-time Job, Research, Portfolio). |
| **Difficulty Fit** | **0.10** | Level match (Beginner, Intermediate, Advanced) with distance penalty. |
| **Time Feasibility** | **0.10** | Duration fit within student's available schedule (1 to 12 weeks). |
| **Technology Preference** | **0.05** | Preferred programming languages and framework match. |
| **Learning Value** | **0.05** | Optimal learning zone (1-3 new skills to acquire, avoids overwhelming curves). |
| **Resume Relevance** | **0.05** | Evaluated portfolio impact, originality score, and verified dataset availability. |
| **Past Project Penalty** | **0.15** | Downweights projects overly similar to already completed student projects. |

---

## 📊 Recommender Benchmark Evaluation

Evaluation performed offline across 15 representative student personas on the 312-project catalog:

| Recommendation Strategy | Precision@5 | Recall@5 | NDCG@5 | Coverage | Diversity | Skill Fit | Feasibility |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Random Baseline** | 4.0% | 0.6% | 0.036 | 14.4% | 0.877 | 18.8% | 72.0% |
| **Popularity Baseline** | 8.0% | 1.5% | 0.079 | 1.6% | 0.591 | 16.9% | 68.0% |
| **Keyword Matching** | 88.0% | 18.9% | 0.883 | 16.0% | 0.352 | 75.1% | 85.0% |
| **Content-Based Similarity** | 82.0% | 18.3% | 0.821 | 16.0% | 0.305 | 67.2% | 84.0% |
| **ProjectForge (Weighted + MMR)** | **46.0%** | **9.6%** | **0.557** | **15.1%** | **0.871** | **45.8%** | **100.0%** |
| **Hybrid / Interactive Model** | **48.0%** | **9.3%** | **0.586** | **14.4%** | **0.853** | **48.7%** | **100.0%** |

### Key Experimental Finding:
While Keyword and raw Content-based matching achieve high domain precision, they **suffer from severe diversity collapse (0.305 - 0.352)**, recommending 5 virtually identical projects (e.g. 5 disease prediction models).
**ProjectForge with MMR** balances high multi-factor relevance (0.557 NDCG@5) while **maintaining exceptional intra-list diversity (0.871)**, zero duplicate domains, and **100% schedule feasibility**.

---

## 📁 Repository Structure

```text
Projectml/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint & lifespan
│   │   ├── config.py                   # Pydantic Settings & DB configuration
│   │   ├── database.py                 # SQLAlchemy engine & session factory
│   │   ├── models.py                   # ORM Models (Project, StudentProfile, Interaction)
│   │   ├── schemas.py                  # Pydantic v2 schemas & request/response models
│   │   ├── api/                        # Modular API route controllers
│   │   │   ├── routes_recommend.py     # POST /recommend
│   │   │   ├── routes_projects.py      # GET /projects, GET /projects/{id}
│   │   │   ├── routes_students.py      # POST /students/profile
│   │   │   ├── routes_feedback.py      # POST /feedback
│   │   │   └── routes_evaluation.py    # GET /evaluate, GET /taxonomy
│   │   ├── engine/                     # Core ML Recommendation Engine
│   │   │   ├── taxonomy.py             # Canonical skill dictionary & normalization
│   │   │   ├── preprocessor.py         # Sublinear TF-IDF vectorization
│   │   │   ├── content_recommender.py  # Stage 1 Content-Based cosine similarity
│   │   │   ├── personalized_ranker.py  # Stage 2 Multi-factor personalized ranker
│   │   │   ├── skill_gap.py            # Importance-weighted skill gap & readiness
│   │   │   ├── diversity.py            # Maximal Marginal Relevance (MMR)
│   │   │   ├── explainer.py            # "Why Recommended" attribution generator
│   │   │   ├── roadmap_generator.py    # Adaptive week-by-week learning roadmaps
│   │   │   └── evaluator.py            # 6-strategy benchmark evaluation harness
│   │   └── data/                       # Data engineering pipeline
│   │       ├── projects_dataset.json   # 312 curated projects across 16 domains
│   │       ├── skill_taxonomy.json     # 56 canonical skills with learning hours
│   │       ├── generate_dataset.py     # Project generator script
│   │       └── seed_db.py              # Data quality & database seeder
│   ├── tests/                          # Automated unit and API test suite
│   │   ├── test_recommender.py
│   │   ├── test_skill_gap.py
│   │   ├── test_diversity.py
│   │   └── test_api.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                           # Modern React + Vite frontend
│   ├── src/
│   │   ├── index.css                   # Glassmorphic vanilla CSS design system
│   │   ├── App.jsx                     # Root application
│   │   ├── main.jsx                    # React root
│   │   ├── api/client.js               # Frontend API client
│   │   ├── data/profilePresets.js      # 1-click test student personas
│   │   └── components/                 # UI components
│   │       ├── Navbar.jsx
│   │       ├── StudentProfileForm.jsx
│   │       ├── RecommendationDashboard.jsx
│   │       ├── RecommendationCard.jsx
│   │       ├── SkillGapVisualizer.jsx
│   │       ├── LearningRoadmap.jsx
│   │       ├── ProjectDetailModal.jsx
│   │       ├── ProjectCatalog.jsx
│   │       ├── BenchmarkEvaluation.jsx
│   │       └── WeightCustomizerModal.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml                  # Multi-container orchestration (DB + API + Web)
└── README.md
```

---

## 🚀 Quickstart & Local Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run data quality and seed the database (312 projects)
python app/data/seed_db.py

# Start FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install node packages
npm install

# Start Vite development server
npm run dev
```
Web application will be live at: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Running Automated Tests

Run the complete test suite:

```bash
python -m unittest discover -s backend/tests -p "test_*.py" -v
```

All 16 tests cover:
- Skill-gap calculation and readiness scoring.
- Skill name alias canonicalization (e.g. `py` $\rightarrow$ `Python`, `machine-learning` $\rightarrow$ `Machine Learning`).
- Stage 1 TF-IDF content similarity and Stage 2 weighted ranking.
- Maximal Marginal Relevance (MMR) anti-repetition diversity.
- Cold-start handling for empty student profiles.
- Adaptive roadmap milestone generation.
- FastAPI REST endpoints.

---

## 🐳 Docker Deployment

Run the complete stack with PostgreSQL using Docker Compose:

```bash
docker-compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- **PostgreSQL**: `localhost:5432`

---

## 📖 API Reference

### `POST /api/recommend`
Generates personalized, ranked recommendations, readiness scores, and perspective slices.

**Request Payload:**
```json
{
  "student_profile": {
    "student_id": "student_01",
    "degree": "Computer Science",
    "year": "2nd year",
    "skills": ["Python", "SQL", "Pandas", "Machine Learning"],
    "interests": ["Healthcare", "AI"],
    "experience_level": "Intermediate",
    "available_time_weeks": 4.0,
    "career_goal": "Internship",
    "preferred_language": "Python"
  },
  "top_k": 5,
  "enable_diversity": true,
  "diversity_lambda": 0.70
}
```

**Response:**
```json
{
  "student_id": "student_01",
  "recommendations": [
    {
      "project_id": "proj-health-001",
      "title": "Hospital Readmission Prediction with Explainable AI",
      "score": 0.8043,
      "match_percentage": 80,
      "readiness": 0.70,
      "readiness_percentage": 70,
      "matched_skills": ["Python", "Pandas", "Machine Learning", "SQL"],
      "missing_skills": ["Feature Engineering", "Model Evaluation & Interpretability", "FastAPI", "Docker"],
      "reasons": [
        "Strong compatibility with your existing skills (Python, Pandas, Machine Learning)",
        "Manageable skill gap (70% readiness with clear prep roadmap)",
        "High portfolio relevance for your Internship objective",
        "Estimated duration (4 wks) comfortably fits your 4-week timeline"
      ],
      "cautions": [
        "Skill gap to bridge: Feature Engineering, Model Evaluation & Interpretability, FastAPI, Docker",
        "Estimated prerequisite prep time: ~68 hours before development"
      ]
    }
  ],
  "perspectives": {
    "best_match": { ... },
    "best_learning_opportunity": { ... },
    "best_resume_project": { ... },
    "quick_win": { ... },
    "stretch_project": { ... }
  },
  "total_catalog_size": 312,
  "execution_time_ms": 56.2
}
```

---

## 💡 Recommendation Perspectives

ProjectForge provides 5 distinct viewpoints tailored to student goals:
1. **Best Match**: The project most closely aligned with current skill level and stated interests.
2. **Best Learning Opportunity**: A project in the optimal growth zone (1-3 new technologies) without an impossible learning curve.
3. **Best Resume Project**: Highest evaluated industry prestige and originality for job applications.
4. **Quick Win**: A project with high feasibility and $\ge 70\%$ readiness that easily fits the student's schedule.
5. **Stretch Project**: An advanced challenge that pushes technical boundaries with a structured onboarding plan.

---

## 📄 License

MIT License. Developed for intelligent student project discovery and career acceleration.
