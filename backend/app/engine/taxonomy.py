"""
ProjectForge Canonical Taxonomy and Skill Normalization
Handles mapping raw skill names, abbreviations, and case variations
into standard canonical entities with category, prerequisite, and learning effort metadata.
"""

import re
from typing import Dict, List, Optional, Set, Tuple

# Canonical Domains
VALID_DOMAINS = [
    "Artificial Intelligence",
    "Machine Learning",
    "Natural Language Processing",
    "Computer Vision",
    "Data Science & Analytics",
    "Web Development",
    "Mobile Development",
    "Cloud & DevOps",
    "Cybersecurity",
    "Blockchain & Web3",
    "Internet of Things (IoT)",
    "FinTech & Quant",
    "HealthTech & BioInformatics",
    "EdTech",
    "Climate & Sustainability",
    "Robotics & Autonomous Systems"
]

VALID_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"]

# Canonical Skill Taxonomy with estimated learning hours and prerequisite skills
SKILL_TAXONOMY_REGISTRY: Dict[str, Dict] = {
    # Programming Languages
    "Python": {"category": "Programming Languages", "base_learning_hours": 30, "prereqs": []},
    "JavaScript": {"category": "Programming Languages", "base_learning_hours": 30, "prereqs": []},
    "TypeScript": {"category": "Programming Languages", "base_learning_hours": 25, "prereqs": ["JavaScript"]},
    "Java": {"category": "Programming Languages", "base_learning_hours": 40, "prereqs": []},
    "C++": {"category": "Programming Languages", "base_learning_hours": 50, "prereqs": []},
    "C#": {"category": "Programming Languages", "base_learning_hours": 35, "prereqs": []},
    "Go": {"category": "Programming Languages", "base_learning_hours": 25, "prereqs": []},
    "Rust": {"category": "Programming Languages", "base_learning_hours": 60, "prereqs": ["C++"]},
    "SQL": {"category": "Programming Languages", "base_learning_hours": 20, "prereqs": []},
    "R": {"category": "Programming Languages", "base_learning_hours": 25, "prereqs": []},
    "Kotlin": {"category": "Programming Languages", "base_learning_hours": 30, "prereqs": ["Java"]},
    "Swift": {"category": "Programming Languages", "base_learning_hours": 35, "prereqs": []},
    "Solidity": {"category": "Programming Languages", "base_learning_hours": 30, "prereqs": ["JavaScript"]},
    
    # ML, Data Science & AI
    "Machine Learning": {"category": "Machine Learning", "base_learning_hours": 40, "prereqs": ["Python"]},
    "Deep Learning": {"category": "Machine Learning", "base_learning_hours": 45, "prereqs": ["Machine Learning"]},
    "Pandas": {"category": "Data Science", "base_learning_hours": 15, "prereqs": ["Python"]},
    "NumPy": {"category": "Data Science", "base_learning_hours": 10, "prereqs": ["Python"]},
    "Scikit-Learn": {"category": "Machine Learning", "base_learning_hours": 20, "prereqs": ["Python", "Pandas"]},
    "PyTorch": {"category": "Machine Learning", "base_learning_hours": 40, "prereqs": ["Deep Learning"]},
    "TensorFlow": {"category": "Machine Learning", "base_learning_hours": 40, "prereqs": ["Deep Learning"]},
    "Natural Language Processing": {"category": "AI", "base_learning_hours": 35, "prereqs": ["Machine Learning"]},
    "Computer Vision": {"category": "AI", "base_learning_hours": 40, "prereqs": ["Deep Learning"]},
    "OpenCV": {"category": "Computer Vision", "base_learning_hours": 25, "prereqs": ["Python"]},
    "Hugging Face": {"category": "AI", "base_learning_hours": 20, "prereqs": ["Natural Language Processing", "PyTorch"]},
    "Transformers": {"category": "AI", "base_learning_hours": 30, "prereqs": ["PyTorch"]},
    "Large Language Models": {"category": "AI", "base_learning_hours": 30, "prereqs": ["Transformers"]},
    "LangChain": {"category": "AI", "base_learning_hours": 20, "prereqs": ["Large Language Models", "Python"]},
    "LlamaIndex": {"category": "AI", "base_learning_hours": 20, "prereqs": ["Large Language Models"]},
    "Feature Engineering": {"category": "Machine Learning", "base_learning_hours": 15, "prereqs": ["Pandas"]},
    "Model Evaluation & Interpretability": {"category": "Machine Learning", "base_learning_hours": 15, "prereqs": ["Scikit-Learn"]},
    "SHAP & LIME": {"category": "Machine Learning", "base_learning_hours": 10, "prereqs": ["Model Evaluation & Interpretability"]},
    "Time Series Analysis": {"category": "Data Science", "base_learning_hours": 25, "prereqs": ["Pandas", "Scikit-Learn"]},
    "Data Visualization": {"category": "Data Science", "base_learning_hours": 15, "prereqs": ["Python"]},
    "Matplotlib & Seaborn": {"category": "Data Science", "base_learning_hours": 12, "prereqs": ["Python"]},
    "Plotly": {"category": "Data Science", "base_learning_hours": 12, "prereqs": ["Python"]},
    "Spark": {"category": "Big Data", "base_learning_hours": 35, "prereqs": ["Python", "SQL"]},
    "Airflow": {"category": "Data Engineering", "base_learning_hours": 25, "prereqs": ["Python"]},

    # Web & Backend Frameworks
    "FastAPI": {"category": "Backend", "base_learning_hours": 18, "prereqs": ["Python"]},
    "Flask": {"category": "Backend", "base_learning_hours": 15, "prereqs": ["Python"]},
    "Django": {"category": "Backend", "base_learning_hours": 30, "prereqs": ["Python"]},
    "Node.js": {"category": "Backend", "base_learning_hours": 25, "prereqs": ["JavaScript"]},
    "Express.js": {"category": "Backend", "base_learning_hours": 15, "prereqs": ["Node.js"]},
    "React": {"category": "Frontend", "base_learning_hours": 30, "prereqs": ["JavaScript"]},
    "Next.js": {"category": "Frontend", "base_learning_hours": 20, "prereqs": ["React"]},
    "Vue.js": {"category": "Frontend", "base_learning_hours": 25, "prereqs": ["JavaScript"]},
    "HTML/CSS": {"category": "Frontend", "base_learning_hours": 15, "prereqs": []},
    "Tailwind CSS": {"category": "Frontend", "base_learning_hours": 10, "prereqs": ["HTML/CSS"]},
    "GraphQL": {"category": "Backend", "base_learning_hours": 15, "prereqs": ["JavaScript"]},
    "REST APIs": {"category": "Backend", "base_learning_hours": 12, "prereqs": []},
    "WebSockets": {"category": "Backend", "base_learning_hours": 15, "prereqs": ["REST APIs"]},

    # Databases
    "PostgreSQL": {"category": "Database", "base_learning_hours": 20, "prereqs": ["SQL"]},
    "MySQL": {"category": "Database", "base_learning_hours": 18, "prereqs": ["SQL"]},
    "MongoDB": {"category": "Database", "base_learning_hours": 15, "prereqs": []},
    "Redis": {"category": "Database", "base_learning_hours": 12, "prereqs": []},
    "Vector Databases": {"category": "Database", "base_learning_hours": 15, "prereqs": ["Python"]},
    "Milvus": {"category": "Database", "base_learning_hours": 15, "prereqs": ["Vector Databases"]},
    "ChromaDB": {"category": "Database", "base_learning_hours": 10, "prereqs": ["Vector Databases"]},

    # Cloud, DevOps & Tools
    "Docker": {"category": "DevOps", "base_learning_hours": 20, "prereqs": []},
    "Kubernetes": {"category": "DevOps", "base_learning_hours": 40, "prereqs": ["Docker"]},
    "AWS": {"category": "Cloud", "base_learning_hours": 35, "prereqs": []},
    "GCP": {"category": "Cloud", "base_learning_hours": 35, "prereqs": []},
    "Azure": {"category": "Cloud", "base_learning_hours": 35, "prereqs": []},
    "Git": {"category": "DevOps", "base_learning_hours": 10, "prereqs": []},
    "CI/CD": {"category": "DevOps", "base_learning_hours": 15, "prereqs": ["Git"]},
    "MLflow": {"category": "MLOps", "base_learning_hours": 15, "prereqs": ["Machine Learning"]},
    "Weights & Biases": {"category": "MLOps", "base_learning_hours": 10, "prereqs": ["Machine Learning"]},

    # Cybersecurity, Systems & Networks
    "Network Security": {"category": "Cybersecurity", "base_learning_hours": 30, "prereqs": []},
    "Cryptography": {"category": "Cybersecurity", "base_learning_hours": 35, "prereqs": []},
    "Penetration Testing": {"category": "Cybersecurity", "base_learning_hours": 45, "prereqs": ["Network Security", "Linux"]},
    "Linux": {"category": "Systems", "base_learning_hours": 20, "prereqs": []},
    "Wireshark": {"category": "Cybersecurity", "base_learning_hours": 15, "prereqs": ["Network Security"]},

    # Specialized: Robotics, IoT, Mobile, Web3
    "ROS (Robot Operating System)": {"category": "Robotics", "base_learning_hours": 45, "prereqs": ["C++", "Python", "Linux"]},
    "Arduino / ESP32": {"category": "IoT", "base_learning_hours": 20, "prereqs": ["C++"]},
    "MQTT": {"category": "IoT", "base_learning_hours": 12, "prereqs": []},
    "React Native": {"category": "Mobile", "base_learning_hours": 25, "prereqs": ["React"]},
    "Flutter": {"category": "Mobile", "base_learning_hours": 30, "prereqs": []},
    "Web3.js / Ethers.js": {"category": "Blockchain", "base_learning_hours": 20, "prereqs": ["JavaScript", "Solidity"]},
}

# Alias mapping for skill name normalization
SKILL_ALIASES: Dict[str, str] = {
    # ML / AI aliases
    "ml": "Machine Learning",
    "machine-learning": "Machine Learning",
    "machinelearning": "Machine Learning",
    "machine learning": "Machine Learning",
    "basic machine learning": "Machine Learning",
    "applied ml": "Machine Learning",
    
    "dl": "Deep Learning",
    "deep-learning": "Deep Learning",
    "deeplearning": "Deep Learning",
    "deep learning": "Deep Learning",
    "neural networks": "Deep Learning",
    "ann": "Deep Learning",
    "cnn": "Deep Learning",
    
    "nlp": "Natural Language Processing",
    "natural-language-processing": "Natural Language Processing",
    "text analytics": "Natural Language Processing",
    
    "cv": "Computer Vision",
    "computer-vision": "Computer Vision",
    "vision": "Computer Vision",
    "image processing": "Computer Vision",
    
    "llm": "Large Language Models",
    "llms": "Large Language Models",
    "large language model": "Large Language Models",
    "genai": "Large Language Models",
    "generative ai": "Large Language Models",
    
    "langchain": "LangChain",
    "llamaindex": "LlamaIndex",
    "llama index": "LlamaIndex",
    
    # Data Science / Python
    "python": "Python",
    "python3": "Python",
    "py": "Python",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "scikitlearn": "Scikit-Learn",
    "scikit learn": "Scikit-Learn",
    "pytorch": "PyTorch",
    "torch": "PyTorch",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "keras": "TensorFlow",
    "opencv": "OpenCV",
    "cv2": "OpenCV",
    "huggingface": "Hugging Face",
    "hugging face": "Hugging Face",
    "transformers": "Transformers",
    "feature engineering": "Feature Engineering",
    "feature-engineering": "Feature Engineering",
    "model evaluation": "Model Evaluation & Interpretability",
    "model interpretability": "Model Evaluation & Interpretability",
    "explainable ai": "Model Evaluation & Interpretability",
    "xai": "Model Evaluation & Interpretability",
    "shap": "SHAP & LIME",
    "lime": "SHAP & LIME",
    "time series": "Time Series Analysis",
    "timeseries": "Time Series Analysis",
    "data visualization": "Data Visualization",
    "dataviz": "Data Visualization",
    "matplotlib": "Matplotlib & Seaborn",
    "seaborn": "Matplotlib & Seaborn",
    "plotly": "Plotly",
    
    # Web & Languages
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "java": "Java",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "sql": "SQL",
    "r": "R",
    "kotlin": "Kotlin",
    "swift": "Swift",
    "solidity": "Solidity",
    
    # Frameworks & Backend
    "fastapi": "FastAPI",
    "fast-api": "FastAPI",
    "flask": "Flask",
    "django": "Django",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "node": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "express.js": "Express.js",
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "html": "HTML/CSS",
    "css": "HTML/CSS",
    "html/css": "HTML/CSS",
    "html5": "HTML/CSS",
    "css3": "HTML/CSS",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "graphql": "GraphQL",
    "rest api": "REST APIs",
    "rest": "REST APIs",
    "restful api": "REST APIs",
    "apis": "REST APIs",
    "websockets": "WebSockets",
    "websocket": "WebSockets",
    
    # Databases
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mysql": "MySQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "vector db": "Vector Databases",
    "vector databases": "Vector Databases",
    "milvus": "Milvus",
    "chroma": "ChromaDB",
    "chromadb": "ChromaDB",
    
    # DevOps / Cloud
    "docker": "Docker",
    "docker containers": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "GCP",
    "google cloud": "GCP",
    "azure": "Azure",
    "git": "Git",
    "github": "Git",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "github actions": "CI/CD",
    "mlflow": "MLflow",
    "wandb": "Weights & Biases",
    "weights and biases": "Weights & Biases",
    "airflow": "Airflow",
    "apache airflow": "Airflow",
    "spark": "Spark",
    "pyspark": "Spark",
    
    # Security / Systems
    "linux": "Linux",
    "bash": "Linux",
    "shell": "Linux",
    "network security": "Network Security",
    "cryptography": "Cryptography",
    "crypto": "Cryptography",
    "pen testing": "Penetration Testing",
    "penetration testing": "Penetration Testing",
    "wireshark": "Wireshark",
    
    # Specialized
    "ros": "ROS (Robot Operating System)",
    "robot operating system": "ROS (Robot Operating System)",
    "arduino": "Arduino / ESP32",
    "esp32": "Arduino / ESP32",
    "mqtt": "MQTT",
    "react native": "React Native",
    "flutter": "Flutter",
    "web3": "Web3.js / Ethers.js",
    "web3.js": "Web3.js / Ethers.js",
    "ethers": "Web3.js / Ethers.js",
}


def normalize_skill_name(raw_name: str) -> str:
    """
    Normalizes any raw or messy skill name into its canonical form.
    E.g.: 'machine-learning' -> 'Machine Learning', 'py' -> 'Python'
    """
    cleaned = raw_name.strip().lower()
    cleaned = re.sub(r"[\s\-_]+", " ", cleaned).strip()
    
    # Direct alias lookup
    if cleaned in SKILL_ALIASES:
        return SKILL_ALIASES[cleaned]
    
    # Check with punctuation removed
    clean_no_punct = re.sub(r"[^\w\s]", "", cleaned)
    if clean_no_punct in SKILL_ALIASES:
        return SKILL_ALIASES[clean_no_punct]
        
    # Check exact case-insensitive match against registry
    for canonical in SKILL_TAXONOMY_REGISTRY.keys():
        if canonical.lower() == cleaned:
            return canonical
            
    # Title casing fallback
    return raw_name.strip().title()


def normalize_skill_list(skills: List[str]) -> List[str]:
    """
    Normalizes a list of skills, deduplicating while preserving order.
    """
    seen: Set[str] = set()
    result: List[str] = []
    for s in skills:
        if not s or not s.strip():
            continue
        canon = normalize_skill_name(s)
        if canon not in seen:
            seen.add(canon)
            result.append(canon)
    return result


def normalize_difficulty(difficulty: str) -> str:
    """
    Maps beginner/easy, intermediate/medium, advanced/hard to canonical Difficulty.
    """
    d = difficulty.strip().lower()
    if d in ["beginner", "easy", "entry", "starter", "introductory", "novice"]:
        return "Beginner"
    elif d in ["intermediate", "medium", "moderate", "mid"]:
        return "Intermediate"
    elif d in ["advanced", "hard", "expert", "complex"]:
        return "Advanced"
    return "Intermediate"


def normalize_duration(duration_str_or_num) -> float:
    """
    Normalizes duration in weeks into a float value.
    Handles '3-4 weeks', '4 weeks', '1 month' (4 weeks), 4, etc.
    """
    if isinstance(duration_str_or_num, (int, float)):
        return float(duration_str_or_num)
    
    s = str(duration_str_or_num).lower().strip()
    # Match ranges like 3-4 weeks or 2 to 3 weeks
    range_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)", s)
    if range_match:
        low = float(range_match.group(1))
        high = float(range_match.group(2))
        return (low + high) / 2.0
        
    # Match single numbers like 4 weeks or 2 months
    num_match = re.search(r"(\d+(?:\.\d+)?)", s)
    if num_match:
        val = float(num_match.group(1))
        if "month" in s:
            return val * 4.0
        elif "day" in s:
            return max(0.5, val / 7.0)
        return val
        
    return 4.0  # Default 4 weeks


def get_skill_metadata(skill: str) -> Dict:
    """
    Returns taxonomy metadata for a skill (category, base learning hours, prerequisites).
    """
    canon = normalize_skill_name(skill)
    return SKILL_TAXONOMY_REGISTRY.get(canon, {
        "category": "General",
        "base_learning_hours": 20,
        "prereqs": []
    })
