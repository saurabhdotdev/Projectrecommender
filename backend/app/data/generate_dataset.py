"""
Dataset generator for ProjectForge.
Generates 250+ curated, realistic, production-grade project specifications
spanning 16 domains, subdomains, real dataset sources, and skill importance weights.
"""

import json
import os
import random
from typing import List, Dict

PROJECT_TEMPLATES = [
    # ------------------ HEALTHCARE & AI / ML ------------------
    {
        "project_id": "proj-health-001",
        "title": "Hospital Readmission Prediction with Explainable AI",
        "description": "Predict 30-day patient hospital readmissions using EHR data, handling severe class imbalance and interpreting risk drivers using SHAP and LIME for clinician trust.",
        "domain": "HealthTech & BioInformatics",
        "subdomain": "Clinical Predictive Analytics",
        "difficulty": "Intermediate",
        "required_skills": ["Python", "Pandas", "Machine Learning", "SQL", "Feature Engineering", "Model Evaluation & Interpretability", "FastAPI", "Docker"],
        "skill_importance": {"Python": 0.20, "Pandas": 0.15, "Machine Learning": 0.20, "SQL": 0.15, "Feature Engineering": 0.10, "Model Evaluation & Interpretability": 0.10, "FastAPI": 0.05, "Docker": 0.05},
        "programming_languages": ["Python", "SQL"],
        "frameworks": ["Scikit-Learn", "FastAPI"],
        "tools": ["Docker", "Git"],
        "prerequisites": ["Basic statistics", "Supervised learning fundamentals"],
        "estimated_duration": 4.0,
        "dataset_available": True,
        "dataset_source": "MIMIC-III / UCI Diabetes 130-US hospitals dataset",
        "project_type": "Applied ML & Explainability",
        "career_paths": ["Healthcare Data Scientist", "ML Engineer", "Data Science Intern"],
        "resume_value": 9.2,
        "originality_score": 8.5,
        "learning_outcomes": ["Clinical feature engineering", "Class imbalance mitigation (SMOTE/Focal Loss)", "SHAP tree explainability", "Model serving with FastAPI container"]
    },
    {
        "project_id": "proj-health-002",
        "title": "Automated Chest X-Ray Pathology Detection",
        "description": "Multi-label classification of chest radiographs to detect pneumonia, cardiomegaly, and effusion using DenseNet-121 with Grad-CAM visual attention maps.",
        "domain": "Computer Vision",
        "subdomain": "Medical Imaging",
        "difficulty": "Advanced",
        "required_skills": ["Python", "PyTorch", "Computer Vision", "Deep Learning", "OpenCV", "Docker"],
        "skill_importance": {"PyTorch": 0.30, "Computer Vision": 0.25, "Deep Learning": 0.20, "Python": 0.15, "OpenCV": 0.05, "Docker": 0.05},
        "programming_languages": ["Python"],
        "frameworks": ["PyTorch", "Torchvision"],
        "tools": ["Docker", "Weights & Biases"],
        "prerequisites": ["Convolutional Neural Networks", "PyTorch basics"],
        "estimated_duration": 5.0,
        "dataset_available": True,
        "dataset_source": "NIH ChestX-ray14 dataset (112,120 frontal-view X-rays)",
        "project_type": "Deep Learning Vision",
        "career_paths": ["Computer Vision Engineer", "Medical AI Researcher", "Deep Learning Specialist"],
        "resume_value": 9.5,
        "originality_score": 8.8,
        "learning_outcomes": ["Multi-label AUC optimization", "Transfer learning on medical images", "Grad-CAM saliency localization", "DICOM format parsing"]
    },
    {
        "project_id": "proj-health-003",
        "title": "Clinical Trial Protocol Semantic Search & Eligibility RAG",
        "description": "Retrieval-Augmented Generation (RAG) system matching oncology patient inclusion/exclusion criteria to active ClinicalTrials.gov protocols using hybrid dense-sparse vector search.",
        "domain": "Natural Language Processing",
        "subdomain": "Biomedical NLP & LLMs",
        "difficulty": "Advanced",
        "required_skills": ["Python", "Large Language Models", "LangChain", "Vector Databases", "Natural Language Processing", "FastAPI"],
        "skill_importance": {"Large Language Models": 0.25, "LangChain": 0.20, "Vector Databases": 0.20, "Natural Language Processing": 0.15, "Python": 0.10, "FastAPI": 0.10},
        "programming_languages": ["Python"],
        "frameworks": ["LangChain", "Hugging Face", "FastAPI"],
        "tools": ["ChromaDB", "Docker"],
        "prerequisites": ["Transformer architectures", "Vector embeddings"],
        "estimated_duration": 4.5,
        "dataset_available": True,
        "dataset_source": "ClinicalTrials.gov Public API & Protocol Dump",
        "project_type": "GenAI / LLM Application",
        "career_paths": ["NLP Engineer", "LLM Application Developer", "Bioinformatics Scientist"],
        "resume_value": 9.4,
        "originality_score": 9.0,
        "learning_outcomes": ["Chunking complex medical protocols", "Hybrid BM25 + dense embedding retrieval", "Hallucination reduction via grounded citations"]
    },
    {
        "project_id": "proj-health-004",
        "title": "Continuous Glucose Monitoring Time Series Anomaly Detector",
        "description": "Detect impending hypoglycemic events in diabetic patients from wearable CGM continuous sensor streams using temporal convolutional networks (TCN).",
        "domain": "Data Science & Analytics",
        "subdomain": "Wearable Health IoT",
        "difficulty": "Intermediate",
        "required_skills": ["Python", "Time Series Analysis", "Pandas", "Scikit-Learn", "Matplotlib & Seaborn"],
        "skill_importance": {"Time Series Analysis": 0.30, "Pandas": 0.25, "Python": 0.20, "Scikit-Learn": 0.15, "Matplotlib & Seaborn": 0.10},
        "programming_languages": ["Python"],
        "frameworks": ["Scikit-Learn", "Statsmodels"],
        "tools": ["Git"],
        "prerequisites": ["Time-series decomposition", "Signal processing basics"],
        "estimated_duration": 3.5,
        "dataset_available": True,
        "dataset_source": "OhioT1DM / PhysioNet CGM Database",
        "project_type": "Time Series Modeling",
        "career_paths": ["Data Analyst", "Health Data Scientist", "IoT Analytics Engineer"],
        "resume_value": 8.6,
        "originality_score": 8.3,
        "learning_outcomes": ["Sensor time-series feature extraction", "Sliding window cross-validation", "Early warning alert thresholding"]
    },
    {
        "project_id": "proj-health-005",
        "title": "Genomic Variant Calling & Pathogenicity Classifier",
        "description": "Machine learning classification of single nucleotide polymorphisms (SNPs) to distinguish benign from pathogenic variants using functional annotations and conservation scores.",
        "domain": "HealthTech & BioInformatics",
        "subdomain": "Computational Genomics",
        "difficulty": "Advanced",
        "required_skills": ["Python", "Machine Learning", "Pandas", "Feature Engineering", "SQL"],
        "skill_importance": {"Machine Learning": 0.30, "Python": 0.25, "Pandas": 0.20, "Feature Engineering": 0.15, "SQL": 0.10},
        "programming_languages": ["Python", "SQL"],
        "frameworks": ["Scikit-Learn", "XGBoost"],
        "tools": ["Git"],
        "prerequisites": ["Genetics fundamentals", "Tree-based gradient boosting"],
        "estimated_duration": 5.0,
        "dataset_available": True,
        "dataset_source": "ClinVar NCBI Database",
        "project_type": "Bioinformatics ML",
        "career_paths": ["Computational Biologist", "Genomics Data Scientist"],
        "resume_value": 9.1,
        "originality_score": 9.2,
        "learning_outcomes": ["Bioinformatics data formats (VCF/GFF)", "Handling extreme feature collinearity", "Evaluating pathogenic precision curves"]
    },
    # ------------------ NLP & LARGE LANGUAGE MODELS ------------------
    {
        "project_id": "proj-nlp-001",
        "title": "Autonomous Financial Earnings Call Q&A Agent",
        "description": "End-to-end agentic workflow parsing 10-K filings and quarterly earnings audio transcripts, computing sentiment shifts, and answering financial analyst inquiries with citations.",
        "domain": "Natural Language Processing",
        "subdomain": "Agentic LLMs & RAG",
        "difficulty": "Advanced",
        "required_skills": ["Python", "Large Language Models", "LangChain", "FastAPI", "Vector Databases", "Docker"],
        "skill_importance": {"Large Language Models": 0.30, "LangChain": 0.25, "Vector Databases": 0.15, "FastAPI": 0.15, "Python": 0.10, "Docker": 0.05},
        "programming_languages": ["Python"],
        "frameworks": ["LangChain", "FastAPI"],
        "tools": ["ChromaDB", "Docker"],
        "prerequisites": ["RAG principles", "Prompt engineering"],
        "estimated_duration": 4.5,
        "dataset_available": True,
        "dataset_source": "SEC EDGAR API & Motley Fool Earnings Transcripts",
        "project_type": "GenAI Agent",
        "career_paths": ["AI Engineer", "FinTech NLP Specialist", "LLM Systems Developer"],
        "resume_value": 9.6,
        "originality_score": 9.3,
        "learning_outcomes": ["Self-reflective multi-hop RAG", "Numerical table extraction from PDFs", "Evaluation via Ragas framework"]
    },
    {
        "project_id": "proj-nlp-002",
        "title": "Low-Resource Language Machine Translation with LoRA",
        "description": "Parameter-Efficient Fine-Tuning (PEFT/LoRA) of open Llama/Mistral models to translate underrepresented regional dialects with back-translation data augmentation.",
        "domain": "Natural Language Processing",
        "subdomain": "Model Fine-Tuning",
        "difficulty": "Advanced",
        "required_skills": ["Python", "PyTorch", "Hugging Face", "Transformers", "Natural Language Processing"],
        "skill_importance": {"Transformers": 0.30, "PyTorch": 0.25, "Hugging Face": 0.20, "Natural Language Processing": 0.15, "Python": 0.10},
        "programming_languages": ["Python"],
        "frameworks": ["Transformers", "PEFT", "PyTorch"],
        "tools": ["Weights & Biases", "Git"],
        "prerequisites": ["Transformer fine-tuning", "Bilingual evaluation (BLEU/chrF)"],
        "estimated_duration": 4.0,
        "dataset_available": True,
        "dataset_source": "FLORES-200 / OPUS multilingual parallel corpus",
        "project_type": "Deep Learning NLP",
        "career_paths": ["NLP Research Engineer", "Localization AI Developer"],
        "resume_value": 9.2,
        "originality_score": 9.0,
        "learning_outcomes": ["Quantization and QLoRA training", "Data curation for low-resource pairs", "BLEU/chrF benchmark evaluation"]
    },
    {
        "project_id": "proj-nlp-003",
        "title": "Customer Review Aspect-Based Sentiment & Root Cause Analyzer",
        "description": "Extract granular entity-level aspects (e.g. battery life, packaging, UI speed) and polarities from e-commerce reviews using DeBERTa and dependency parsing.",
        "domain": "Natural Language Processing",
        "subdomain": "Aspect Sentiment Analysis",
        "difficulty": "Intermediate",
        "required_skills": ["Python", "Natural Language Processing", "Transformers", "Pandas", "Scikit-Learn"],
        "skill_importance": {"Natural Language Processing": 0.30, "Transformers": 0.25, "Python": 0.20, "Pandas": 0.15, "Scikit-Learn": 0.10},
        "programming_languages": ["Python"],
        "frameworks": ["Transformers", "Hugging Face", "Spacy"],
        "tools": ["Git"],
        "prerequisites": ["Tokenization", "Transformer text classification"],
        "estimated_duration": 3.5,
        "dataset_available": True,
        "dataset_source": "Amazon E-Commerce Reviews / SemEval ABSA Dataset",
        "project_type": "Applied NLP",
        "career_paths": ["NLP Engineer", "Data Scientist", "Product Analytics Specialist"],
        "resume_value": 8.7,
        "originality_score": 8.1,
        "learning_outcomes": ["Aspect-term extraction", "Transformer token classification (NER)", "Interactive topic clustering"]
    },
    {
        "project_id": "proj-nlp-004",
        "title": "Code Vulnerability Detection & Auto-Refactoring with LLMs",
        "description": "Analyze source code repositories for OWASP Top 10 security vulnerabilities and generate verified unit test cases with proposed patch explanations.",
        "domain": "Cybersecurity",
        "subdomain": "AI for Software Security",
        "difficulty": "Advanced",
        "required_skills": ["Python", "Large Language Models", "Linux", "Docker", "Git"],
        "skill_importance": {"Large Language Models": 0.30, "Python": 0.25, "Docker": 0.20, "Linux": 0.15, "Git": 0.10},
        "programming_languages": ["Python"],
        "frameworks": ["LangChain", "FastAPI"],
        "tools": ["Docker", "Git"],
        "prerequisites": ["Static code analysis", "Software security basics"],
        "estimated_duration": 4.5,
        "dataset_available": True,
        "dataset_source": "Big-Vul / Devign C/C++ and Python Vulnerability Dataset",
        "project_type": "Security & AI",
        "career_paths": ["Application Security Engineer", "DevSecOps Engineer", "AI Safety Engineer"],
        "resume_value": 9.4,
        "originality_score": 9.1,
        "learning_outcomes": ["Abstract syntax tree (AST) parsing", "Few-shot prompting for code repair", "Sandboxed Docker execution for verification"]
    },
    # ------------------ COMPUTER VISION ------------------
    {
        "project_id": "proj-cv-001",
        "title": "Real-Time PPE & Worker Safety Compliance Monitoring",
        "description": "Edge-optimized object detection system identifying safety helmets, high-visibility vests, and restricted zone incursions on construction sites at 30 FPS.",
        "domain": "Computer Vision",
        "subdomain": "Edge Object Detection",
        "difficulty": "Intermediate",
        "required_skills": ["Python", "Computer Vision", "OpenCV", "Deep Learning", "Docker"],
        "skill_importance": {"Computer Vision": 0.30, "OpenCV": 0.25, "Python": 0.20, "Deep Learning": 0.15, "Docker": 0.10},
        "programming_languages": ["Python"],
        "frameworks": ["YOLOv8", "OpenCV", "PyTorch"],
        "tools": ["Docker", "Git"],
        "prerequisites": ["Object detection fundamentals", "Bounding box metrics (mAP)"],
        "estimated_duration": 3.5,
        "dataset_available": True,
        "dataset_source": "Hardhat & Safety Vest Benchmark Dataset (Roboflow Universe)",
        "project_type": "Real-Time CV",
        "career_paths": ["Computer Vision Engineer", "Industrial AI Specialist", "Robotics Vision Engineer"],
        "resume_value": 9.0,
        "originality_score": 8.4,
        "learning_outcomes": ["YOLOv8 model fine-tuning", "Video stream decoding and buffer management", "Inference optimization (ONNX / TensorRT)"]
    },
    {
        "project_id": "proj-cv-002",
        "title": "Autonomous Vehicle Urban Scene Semantic Segmentation",
        "description": "Pixel-level segmentation of road surfaces, sidewalks, vehicles, cyclists, and traffic signage using SegFormer and DeepLabV3+ architectures.",
        "domain": "Computer Vision",
        "subdomain": "Autonomous Driving Systems",
        "difficulty": "Advanced",
        "required_skills": ["Python", "PyTorch", "Computer Vision", "Deep Learning", "Docker"],
        "skill_importance": {"PyTorch": 0.30, "Computer Vision": 0.30, "Deep Learning": 0.20, "Python": 0.10, "Docker": 0.10},
        "programming_languages": ["Python"],
        "frameworks": ["PyTorch", "Torchvision", "Hugging Face"],
        "tools": ["Docker", "Weights & Biases"],
        "prerequisites": ["Semantic segmentation", "mIoU evaluation"],
        "estimated_duration": 5.0,
        "dataset_available": True,
        "dataset_source": "Cityscapes Dataset / CamVid Urban Driving",
        "project_type": "Perception System",
        "career_paths": ["Autonomous Driving Engineer", "Perception Engineer", "Deep Learning Researcher"],
        "resume_value": 9.6,
        "originality_score": 9.0,
        "learning_outcomes": ["Encoder-decoder segmentation architectures", "Loss engineering with Dice + Cross-Entropy", "Real-time latency profiling"]
    },
    {
        "project_id": "proj-cv-003",
        "title": "Deepfake Video Detection with Spatio-Temporal Artifacts",
        "description": "Identify facial manipulations and synthetic audio-visual desynchronization in talking-head videos using 3D CNNs and eye-blink frequency telemetry.",
        "domain": "Computer Vision",
        "subdomain": "Forensic AI & Security",
        "difficulty": "Advanced",
        "required_skills": ["Python", "Deep Learning", "Computer Vision", "PyTorch", "OpenCV"],
        "skill_importance": {"Deep Learning": 0.30, "Computer Vision": 0.25, "PyTorch": 0.25, "Python": 0.10, "OpenCV": 0.10},
        "programming_languages": ["Python"],
        "frameworks": ["PyTorch", "OpenCV"],
        "tools": ["Git"],
        "prerequisites": ["Video frame extraction", "Recurrent/3D Convolutional networks"],
        "estimated_duration": 4.5,
        "dataset_available": True,
        "dataset_source": "FaceForensics++ / DFDC (Deepfake Detection Challenge)",
        "project_type": "Video AI & Cybersecurity",
        "career_paths": ["AI Safety Specialist", "Digital Forensics Engineer", "Computer Vision Researcher"],
        "resume_value": 9.4,
        "originality_score": 9.2,
        "learning_outcomes": ["Spatio-temporal feature extraction", "Robustness against video compression artifacts", "ROC-AUC generalization across generators"]
    },
    # ------------------ FINTECH & QUANTITATIVE FINANCE ------------------
    {
        "project_id": "proj-fin-001",
        "title": "Real-Time Credit Card Fraud Detection Pipeline with Kafka",
        "description": "Low-latency fraud scoring engine handling millions of streaming transactions with highly skewed distributions, online feature stores, and automated alert triage.",
        "domain": "FinTech & Quant",
        "subdomain": "Fraud & Risk Engineering",
        "difficulty": "Intermediate",
        "required_skills": ["Python", "Machine Learning", "FastAPI", "Docker", "Pandas", "SQL"],
        "skill_importance": {"Machine Learning": 0.25, "FastAPI": 0.20, "Python": 0.20, "Docker": 0.15, "SQL": 0.10, "Pandas": 0.10},
        "programming_languages": ["Python", "SQL"],
        "frameworks": ["Scikit-Learn", "FastAPI", "XGBoost"],
        "tools": ["Docker", "Redis"],
        "prerequisites": ["Imbalanced classification", "REST API architecture"],
        "estimated_duration": 4.0,
        "dataset_available": True,
        "dataset_source": "ULB European Credit Card Fraud Dataset (284,807 transactions)",
        "project_type": "Production ML Pipeline",
        "career_paths": ["FinTech Data Scientist", "MLOps Engineer", "Risk Systems Engineer"],
        "resume_value": 9.2,
        "originality_score": 8.2,
        "learning_outcomes": ["Cost-sensitive learning matrices", "Sub-10ms model inference pipelines", "Redis caching for sliding transaction velocities"]
    },
    {
        "project_id": "proj-fin-002",
        "title": "High-Frequency Limit Order Book Microstructure Predictor",
        "description": "Predict short-term mid-price direction and spread dynamics from Level-2 order book depth using spatial-temporal LSTM and order flow imbalance (OFI).",
        "domain": "FinTech & Quant",
        "subdomain": "Quantitative Trading",
        "difficulty": "Advanced",
        "required_skills": ["Python", "Time Series Analysis", "Deep Learning", "PyTorch", "NumPy"],
        "skill_importance": {"Time Series Analysis": 0.30, "PyTorch": 0.25, "Deep Learning": 0.20, "NumPy": 0.15, "Python": 0.10},
        "programming_languages": ["Python"],
        "frameworks": ["PyTorch", "NumPy"],
        "tools": ["Git"],
        "prerequisites": ["Market microstructure basics", "Recurrent neural architectures"],
        "estimated_duration": 5.0,
        "dataset_available": True,
        "dataset_source": "LOBSTER Academic Limit Order Book Benchmark / Binance Orderbook Websocket",
        "project_type": "Quantitative Finance",
        "career_paths": ["Quantitative Researcher", "Algorithmic Trading Developer", "Financial Engineer"],
        "resume_value": 9.6,
        "originality_score": 9.4,
        "learning_outcomes": ["Tick-level order book reconstruction", "Order flow imbalance feature engineering", "Backtesting with realistic slippage and fee friction"]
    },
    {
        "project_id": "proj-fin-003",
        "title": "Crypto Portfolio Optimization & Value-at-Risk Engine",
        "description": "Automated asset allocation optimizer combining Black-Litterman model, Monte Carlo stress simulations, and conditional Value-at-Risk (CVaR) risk limits.",
        "domain": "FinTech & Quant",
        "subdomain": "Portfolio Risk Analytics",
        "difficulty": "Intermediate",
        "required_skills": ["Python", "Data Visualization", "Pandas", "NumPy", "Plotly"],
        "skill_importance": {"Python": 0.25, "NumPy": 0.25, "Pandas": 0.25, "Plotly": 0.15, "Data Visualization": 0.10},
        "programming_languages": ["Python"],
        "frameworks": ["SciPy", "Pandas", "Plotly"],
        "tools": ["Git"],
        "prerequisites": ["Portfolio theory (Markowitz)", "Linear algebra & convex optimization"],
        "estimated_duration": 3.0,
        "dataset_available": True,
        "dataset_source": "CoinGecko / Yahoo Finance Historical Crypto Daily Tickers",
        "project_type": "Quantitative Analysis",
        "career_paths": ["Portfolio Analyst", "FinTech Developer", "Risk Analyst"],
        "resume_value": 8.8,
        "originality_score": 8.0,
        "learning_outcomes": ["Efficient frontier computation", "Monte Carlo parametric simulation", "Interactive risk-return visualization dashboard"]
    },
    # ------------------ FULL STACK & WEB DEVELOPMENT ------------------
    {
        "project_id": "proj-web-001",
        "title": "Collaborative Real-Time Canvas with CRDTs & WebSockets",
        "description": "Multiplayer design whiteboard allowing concurrent stroke and diagram editing with zero merge conflicts using Conflict-Free Replicated Data Types (Yjs).",
        "domain": "Web Development",
        "subdomain": "Distributed Frontend & Real-Time Systems",
        "difficulty": "Advanced",
        "required_skills": ["TypeScript", "React", "Node.js", "WebSockets", "HTML/CSS"],
        "skill_importance": {"TypeScript": 0.30, "React": 0.25, "WebSockets": 0.20, "Node.js": 0.15, "HTML/CSS": 0.10},
        "programming_languages": ["TypeScript", "JavaScript"],
        "frameworks": ["React", "Express.js", "Next.js"],
        "tools": ["Docker", "Git"],
        "prerequisites": ["Advanced React hooks", "Distributed systems state principles"],
        "estimated_duration": 4.5,
        "dataset_available": False,
        "dataset_source": "User generated canvas payloads & operational transforms",
        "project_type": "Full Stack System",
        "career_paths": ["Senior Frontend Engineer", "Full Stack Developer", "Real-Time Systems Engineer"],
        "resume_value": 9.5,
        "originality_score": 9.2,
        "learning_outcomes": ["CRDT state synchronization", "HTML5 Canvas/SVG render tree optimization", "Reconnection resilience and presence tracking"]
    },
    {
        "project_id": "proj-web-002",
        "title": "Developer Learning Management Platform with Code Sandbox",
        "description": "Interactive coding curriculum portal featuring live in-browser code compilation, automated unit test grading, and GitHub OAuth onboarding.",
        "domain": "EdTech",
        "subdomain": "Interactive Learning Platforms",
        "difficulty": "Intermediate",
        "required_skills": ["JavaScript", "React", "FastAPI", "Docker", "PostgreSQL"],
        "skill_importance": {"React": 0.25, "FastAPI": 0.25, "Docker": 0.20, "PostgreSQL": 0.15, "JavaScript": 0.15},
        "programming_languages": ["JavaScript", "Python"],
        "frameworks": ["React", "FastAPI"],
        "tools": ["Docker", "PostgreSQL", "Git"],
        "prerequisites": ["Docker containerization", "Relational database schema design"],
        "estimated_duration": 4.0,
        "dataset_available": True,
        "dataset_source": "LeetCode-style algorithmic challenge problems & unit suites",
        "project_type": "Full Stack Web App",
        "career_paths": ["Full Stack Engineer", "Software Engineer", "EdTech Developer"],
        "resume_value": 9.0,
        "originality_score": 8.5,
        "learning_outcomes": ["Sandboxed code evaluation via Docker API", "JWT authentication & role-based access control", "Relational progress schema design"]
    },
    {
        "project_id": "proj-web-003",
        "title": "Microservices E-Commerce Platform with Saga Orchestration",
        "description": "High-throughput marketplace architecture implementing distributed transactions across payment, inventory, and order fulfillment services.",
        "domain": "Cloud & DevOps",
        "subdomain": "Microservices & Distributed Systems",
        "difficulty": "Advanced",
        "required_skills": ["Go", "Docker", "Kubernetes", "PostgreSQL", "Redis", "CI/CD"],
        "skill_importance": {"Go": 0.25, "Kubernetes": 0.25, "Docker": 0.20, "PostgreSQL": 0.15, "Redis": 0.10, "CI/CD": 0.05},
        "programming_languages": ["Go"],
        "frameworks": ["Gin / Chi"],
        "tools": ["Kubernetes", "Docker", "PostgreSQL", "Redis", "Helm"],
        "prerequisites": ["Microservice communication patterns", "Container orchestration"],
        "estimated_duration": 5.0,
        "dataset_available": False,
        "dataset_source": "Mock transaction and inventory load generators",
        "project_type": "Backend Distributed System",
        "career_paths": ["Backend Engineer", "DevOps Engineer", "Cloud Solutions Architect"],
        "resume_value": 9.6,
        "originality_score": 8.9,
        "learning_outcomes": ["Distributed Saga transaction pattern", "gRPC inter-service communication", "Kubernetes ingress, deployments, and config maps"]
    },
    # ------------------ CYBERSECURITY & NETWORKING ------------------
    {
        "project_id": "proj-sec-001",
        "title": "Intelligent Network Intrusion & Port Scan Detector",
        "description": "Real-time packet capture analyzer parsing PCAP streams, identifying SYN flood and port scans using behavioral entropy and unsupervised isolation forests.",
        "domain": "Cybersecurity",
        "subdomain": "Network Security Monitoring",
        "difficulty": "Intermediate",
        "required_skills": ["Python", "Network Security", "Wireshark", "Machine Learning", "Linux"],
        "skill_importance": {"Network Security": 0.30, "Python": 0.25, "Wireshark": 0.20, "Machine Learning": 0.15, "Linux": 0.10},
        "programming_languages": ["Python"],
        "frameworks": ["Scapy", "Scikit-Learn"],
        "tools": ["Wireshark", "Linux"],
        "prerequisites": ["TCP/IP protocol handshake", "Socket programming"],
        "estimated_duration": 3.5,
        "dataset_available": True,
        "dataset_source": "UNSW-NB15 / CICIDS2017 Intrusion Benchmark Dataset",
        "project_type": "Security Analytics",
        "career_paths": ["SOC Analyst", "Security Engineer", "Cybersecurity Researcher"],
        "resume_value": 9.1,
        "originality_score": 8.6,
        "learning_outcomes": ["Raw packet dissection with Scapy", "Statistical entropy calculations across IP windows", "Anomaly detection on streaming flows"]
    },
    {
        "project_id": "proj-sec-002",
        "title": "Decentralized Zero-Knowledge Identity Verification",
        "description": "Privacy-preserving age and credential verification dApp allowing users to prove attributes without revealing birthdate or national ID using zk-SNARKs.",
        "domain": "Blockchain & Web3",
        "subdomain": "Zero-Knowledge Cryptography",
        "difficulty": "Advanced",
        "required_skills": ["Solidity", "Cryptography", "JavaScript", "Web3.js / Ethers.js", "React"],
        "skill_importance": {"Solidity": 0.30, "Cryptography": 0.30, "Web3.js / Ethers.js": 0.20, "JavaScript": 0.10, "React": 0.10},
        "programming_languages": ["Solidity", "JavaScript"],
        "frameworks": ["Circom", "SnarkJS", "Hardhat", "React"],
        "tools": ["Git"],
        "prerequisites": ["Elliptic curve cryptography", "Smart contract deployment"],
        "estimated_duration": 5.0,
        "dataset_available": False,
        "dataset_source": "Synthetic credential claims and verification circuits",
        "project_type": "Web3 Cryptography",
        "career_paths": ["Smart Contract Auditor", "ZK Protocol Developer", "Blockchain Engineer"],
        "resume_value": 9.7,
        "originality_score": 9.6,
        "learning_outcomes": ["Circom arithmetic circuit design", "Proof generation & on-chain verification", "MetaMask web3 integration"]
    },
    # ------------------ CLIMATE, IOT & ROBOTICS ------------------
    {
        "project_id": "proj-iot-001",
        "title": "Smart Solar Microgrid Energy Forecasting & Load Balancer",
        "description": "Predict photovoltaic solar generation 48 hours ahead using weather telemetry and schedule battery storage charge cycles to minimize peak-tariff costs.",
        "domain": "Climate & Sustainability",
        "subdomain": "CleanTech IoT Analytics",
        "difficulty": "Intermediate",
        "required_skills": ["Python", "Time Series Analysis", "Pandas", "Machine Learning", "MQTT"],
        "skill_importance": {"Time Series Analysis": 0.30, "Machine Learning": 0.25, "Python": 0.20, "Pandas": 0.15, "MQTT": 0.10},
        "programming_languages": ["Python"],
        "frameworks": ["Scikit-Learn", "LightGBM"],
        "tools": ["Git"],
        "prerequisites": ["Linear programming optimization", "Weather data analysis"],
        "estimated_duration": 3.5,
        "dataset_available": True,
        "dataset_source": "NREL Solar Radiation Research Laboratory & Open-Meteo API",
        "project_type": "IoT & Sustainability",
        "career_paths": ["CleanTech Data Scientist", "IoT Systems Engineer", "Energy Systems Analyst"],
        "resume_value": 8.9,
        "originality_score": 9.0,
        "learning_outcomes": ["Integrating solar irradiance models", "Constrained battery scheduling with PuLP", "MQTT message telemetry processing"]
    },
    {
        "project_id": "proj-rob-001",
        "title": "Autonomous Indoor Mobile Robot SLAM & Navigation in ROS 2",
        "description": "Simulate and navigate a differential drive robot in unknown warehouse floorplans using 2D LiDAR, Extended Kalman Filter sensor fusion, and Nav2 path planners.",
        "domain": "Robotics & Autonomous Systems",
        "subdomain": "Robotics SLAM & Motion Planning",
        "difficulty": "Advanced",
        "required_skills": ["ROS (Robot Operating System)", "C++", "Python", "Linux", "OpenCV"],
        "skill_importance": {"ROS (Robot Operating System)": 0.35, "C++": 0.25, "Linux": 0.20, "Python": 0.10, "OpenCV": 0.10},
        "programming_languages": ["C++", "Python"],
        "frameworks": ["ROS 2 Humble", "Nav2", "Gazebo"],
        "tools": ["Linux", "Git"],
        "prerequisites": ["Coordinate frame transformations (TF2)", "Kinematics & PID controllers"],
        "estimated_duration": 5.0,
        "dataset_available": True,
        "dataset_source": "Gazebo Simulated Warehouse & Real LiDAR Odometry Bags",
        "project_type": "Robotics Software",
        "career_paths": ["Robotics Software Engineer", "SLAM Specialist", "Autonomous Systems Engineer"],
        "resume_value": 9.7,
        "originality_score": 9.3,
        "learning_outcomes": ["ROS 2 node & action server architecture", "Cartographer / Nav2 costmap configuration", "Obstacle avoidance dynamic window approach"]
    }
]

# Systematic expansion generators across all domains
DOMAIN_TEMPLATES = {
    "Machine Learning": [
        ("Customer Churn Early Warning System with Survival Analysis", "Predict exact time-to-churn and customer lifetime value using Cox proportional hazards and random survival forests.", "Data Science & Analytics", "Intermediate", ["Python", "Pandas", "Machine Learning", "Scikit-Learn", "Feature Engineering", "SQL"], 3.5, 8.6, 8.2),
        ("Automated Resume & Job Description Semantic Matching Engine", "Rank incoming job applicants against role requirements using contextual embeddings and skill ontology extraction.", "Natural Language Processing", "Intermediate", ["Python", "Natural Language Processing", "FastAPI", "Pandas", "Docker"], 3.5, 8.8, 8.5),
        ("Dynamic E-Commerce Pricing Engine with Contextual Multi-Armed Bandits", "Optimize online product prices dynamically balancing profit margin exploration vs revenue exploitation under demand elasticity.", "Data Science & Analytics", "Advanced", ["Python", "Machine Learning", "NumPy", "Pandas", "Scikit-Learn"], 4.5, 9.3, 9.1),
        ("Real Estate Price Valuation & Hyperlocal Trend Forecasting", "Estimate property sales prices combining structural features, spatial coordinates, and neighborhood walkability indices.", "Data Science & Analytics", "Beginner", ["Python", "Pandas", "NumPy", "Scikit-Learn", "Matplotlib & Seaborn"], 2.5, 7.8, 7.2),
        ("Automated Music Genre Classification & Audio Feature Extractor", "Extract Mel-Frequency Cepstral Coefficients (MFCCs) and spectral centroids to classify audio tracks into 10 genres.", "Machine Learning", "Intermediate", ["Python", "Machine Learning", "NumPy", "Pandas", "Matplotlib & Seaborn"], 3.0, 8.3, 7.9),
    ],
    "Computer Vision": [
        ("Real-Time American Sign Language (ASL) Alphabet Translator", "Translate fingerspelling sign language from webcam feeds into spoken English using MediaPipe hand landmark tracking.", "Computer Vision", "Intermediate", ["Python", "Computer Vision", "OpenCV", "Deep Learning", "NumPy"], 3.5, 9.1, 8.9),
        ("Automated Crop Disease Identification from Smartphone Imagery", "Classify leaf pathogens across 38 crop categories with lightweight MobileNetV3 for rural field deployment.", "Computer Vision", "Beginner", ["Python", "Computer Vision", "Deep Learning", "OpenCV", "Pandas"], 3.0, 8.4, 8.0),
        ("Retail Store Automated Shelf Stocking & Void Spotter", "Detect out-of-stock gaps and product misplaced items on grocery store shelves using multi-class YOLO detectors.", "Computer Vision", "Advanced", ["Python", "Computer Vision", "Deep Learning", "PyTorch", "Docker"], 4.5, 9.3, 8.8),
        ("Drone Aerial Wildfire Smoke & Burn Scar Detection", "Segment active wildfire perimeters from multispectral satellite and UAV aerial imaging using UNet.", "Computer Vision", "Advanced", ["Python", "Computer Vision", "PyTorch", "Deep Learning", "Docker"], 5.0, 9.5, 9.4),
        ("Facial Emotion & Driver Drowsiness Alert System", "Monitor driver eye-aspect ratios and yawning frequencies to trigger audible collision avoidance alerts.", "Computer Vision", "Intermediate", ["Python", "Computer Vision", "OpenCV", "Machine Learning"], 3.0, 8.7, 8.1),
    ],
    "Natural Language Processing": [
        ("Medical Prescription Handwriting Recognition & Drug Interaction Flag", "Perform OCR on doctor prescriptions, extract medication dosages, and check against contraindication databases.", "Natural Language Processing", "Advanced", ["Python", "Natural Language Processing", "Computer Vision", "PyTorch", "FastAPI"], 5.0, 9.5, 9.3),
        ("Automated Legal Contract Risk & Clause Audit Tool", "Extract indemnity, non-compete, and termination clauses from vendor contracts, scoring deviation from standard playbooks.", "Natural Language Processing", "Advanced", ["Python", "Natural Language Processing", "Large Language Models", "LangChain", "FastAPI"], 4.5, 9.4, 9.2),
        ("Multi-Lingual Customer Support Conversational Agent with Tool Calling", "Build an autonomous customer helpdesk chatbot capable of issuing refunds and checking parcel statuses via API tools.", "Natural Language Processing", "Intermediate", ["Python", "Large Language Models", "LangChain", "FastAPI", "Docker"], 3.5, 9.0, 8.7),
        ("Fake News & Rumor Stance Verifier Using Fact-Checking Knowledge Graphs", "Classify truthfulness of viral social claims by retrieving corroborated evidence from accredited fact-checkers.", "Natural Language Processing", "Intermediate", ["Python", "Natural Language Processing", "Transformers", "Pandas", "Scikit-Learn"], 3.5, 8.9, 8.6),
        ("Academic Research Paper Key Claim Summarizer with Citation Network", "Summarize complex scientific papers into 3 key takeaways and construct cross-citation influence graphs.", "Natural Language Processing", "Intermediate", ["Python", "Natural Language Processing", "Transformers", "Pandas", "FastAPI"], 3.5, 8.7, 8.4),
    ],
    "Web Development": [
        ("High-Performance Markdown Note-Taking App with Bidirectional Linking", "Obsidian-like knowledge base featuring graph visualization, offline-first local storage, and instant search.", "Web Development", "Intermediate", ["TypeScript", "React", "HTML/CSS", "Tailwind CSS"], 3.0, 8.8, 8.6),
        ("SaaS Subscription Billing & Tenant Analytics Dashboard", "Multi-tenant business analytics web app with Stripe webhook subscriptions, usage metering, and invoice exports.", "Web Development", "Intermediate", ["JavaScript", "React", "Node.js", "PostgreSQL", "Express.js"], 4.0, 9.0, 8.3),
        ("Real-Time Collaborative Code Editor with Language Server Protocol", "Browser-based IDE featuring syntax highlighting, autocompletion, live pair-programming cursors, and terminal preview.", "Web Development", "Advanced", ["TypeScript", "React", "WebSockets", "Node.js", "Docker"], 5.0, 9.6, 9.2),
        ("Personal Finance Tracker with Plaid Bank Feed Sync", "Full stack personal ledger categorizing transactions, visualizing budget burn rates, and alerting on recurring spikes.", "Web Development", "Beginner", ["JavaScript", "React", "FastAPI", "SQL", "HTML/CSS"], 3.0, 8.5, 8.0),
        ("Developer Community Forum with Markdown & Upvoting Mechanics", "Community discussion portal with nested comment threads, karma scoring, search filtering, and email notifications.", "Web Development", "Beginner", ["JavaScript", "React", "Node.js", "MongoDB", "Express.js"], 3.0, 8.2, 7.5),
    ],
    "Cybersecurity": [
        ("Zero-Trust Microsegmentation & Identity-Aware Proxy", "Secure internal web services with OpenID Connect authentication, mutual TLS certificates, and role-based policies.", "Cybersecurity", "Advanced", ["Go", "Linux", "Docker", "Network Security", "Cryptography"], 4.5, 9.5, 9.1),
        ("Automated Phishing Email Detection & Header Forensics Engine", "Analyze raw MIME emails, SPF/DKIM authentication records, and homograph domain URLs to stop credential phishing.", "Cybersecurity", "Intermediate", ["Python", "Machine Learning", "Natural Language Processing", "Network Security"], 3.5, 9.0, 8.5),
        ("Malware Memory Dump Forensics & C2 Traffic Dissector", "Detect process injection, API hooking, and beaconing command-and-control beacons from Windows memory artifacts.", "Cybersecurity", "Advanced", ["Python", "Linux", "Network Security", "Wireshark", "Penetration Testing"], 5.0, 9.6, 9.4),
        ("Web Application Firewall (WAF) with OWASP Attack Signature Engine", "Reverse proxy inspecting HTTP request headers and query parameters to block SQL injection and XSS payloads.", "Cybersecurity", "Intermediate", ["Go", "Network Security", "Docker", "Linux"], 3.5, 9.1, 8.7),
        ("Decentralized Password Vault with Client-Side Argon2 Encryption", "Zero-knowledge password manager encrypting sensitive secrets on the client before transmitting to cloud sync.", "Cybersecurity", "Intermediate", ["TypeScript", "React", "Cryptography", "Node.js"], 3.5, 9.2, 8.8),
    ],
    "Cloud & DevOps": [
        ("GitOps Continuous Delivery Pipeline with ArgoCD & Kubernetes", "Declarative cluster configuration repository synchronizing application rollouts with automated canary testing.", "Cloud & DevOps", "Intermediate", ["Docker", "Kubernetes", "CI/CD", "Git", "Linux"], 3.5, 9.2, 8.8),
        ("Multi-Cloud Infrastructure-as-Code Provisioner with Terraform", "Automate immutable VPC peering, bastion hosts, and serverless compute clusters across AWS and GCP.", "Cloud & DevOps", "Intermediate", ["AWS", "GCP", "CI/CD", "Git", "Linux"], 3.5, 9.1, 8.5),
        ("Serverless Event-Driven Video Transcoding & HLS Streaming Engine", "Distributed media pipeline slicing raw 4K videos into adaptive bitrate HLS streams using AWS Lambda and S3.", "Cloud & DevOps", "Advanced", ["Python", "AWS", "Docker", "FastAPI"], 4.0, 9.3, 8.9),
        ("Automated Chaos Engineering & Fault Injection Test Suite", "Validate system reliability by programmatically terminating pods, introducing packet loss, and testing circuit breakers.", "Cloud & DevOps", "Advanced", ["Go", "Kubernetes", "Docker", "Linux", "CI/CD"], 4.5, 9.4, 9.2),
        ("Production Observability Stack with Prometheus, Grafana & OpenTelemetry", "Distributed tracing and metrics collection pipeline monitoring microservice latency, CPU throttling, and error spikes.", "Cloud & DevOps", "Beginner", ["Docker", "Linux", "Git", "FastAPI"], 2.5, 8.5, 8.0),
    ],
    "Data Science & Analytics": [
        ("Airline Flight Delay & Cancellation Predictive Modeling", "Predict runway departure delays using Bureau of Transportation Statistics data, weather radar, and aircraft turn times.", "Data Science & Analytics", "Intermediate", ["Python", "Pandas", "Scikit-Learn", "Feature Engineering", "Data Visualization"], 3.0, 8.5, 8.1),
        ("Urban Bike Share Demand Forecasting & Fleet Rebalancing", "Forecast hourly dock checkout volumes across metropolitan stations using gradient boosted trees and holiday calendars.", "Data Science & Analytics", "Beginner", ["Python", "Pandas", "NumPy", "Scikit-Learn", "Matplotlib & Seaborn"], 2.5, 8.2, 7.8),
        ("Supply Chain Inventory Bullwhip Effect Simulation & Safety Stock", "Simulate multi-echelon retail supply chains under stochastic customer demand to optimize warehouse reorder points.", "Data Science & Analytics", "Advanced", ["Python", "Pandas", "NumPy", "Time Series Analysis", "Plotly"], 4.0, 9.1, 8.9),
        ("Sports Analytics: Soccer Expected Goals (xG) & Player Valuation", "Calculate shot conversion probabilities from spatial pitch coordinates and model player possession value.", "Data Science & Analytics", "Intermediate", ["Python", "Pandas", "Machine Learning", "Data Visualization", "Plotly"], 3.5, 8.8, 8.7),
        ("Public Health Epidemiology SIR Spread & Vaccine Rollout Model", "Fit compartmental epidemiological models to regional outbreak telemetry with scenario planning sliders.", "Data Science & Analytics", "Intermediate", ["Python", "NumPy", "Data Visualization", "Pandas", "Plotly"], 3.0, 8.6, 8.3),
    ],
    "Blockchain & Web3": [
        ("Decentralized Automated Market Maker (AMM) with Constant Product (x*y=k)", "Build an Ethereum liquidity pool smart contract enabling token swaps, liquidity provider shares, and flash loans.", "Blockchain & Web3", "Advanced", ["Solidity", "JavaScript", "Web3.js / Ethers.js", "React"], 4.5, 9.6, 9.0),
        ("Verifiable Supply Chain Provenance Tracker with NFT Certificates", "Track pharmaceutical batches from factory to pharmacy with tamper-proof blockchain attestations and QR codes.", "Blockchain & Web3", "Intermediate", ["Solidity", "JavaScript", "React", "Node.js", "Web3.js / Ethers.js"], 3.5, 9.0, 8.6),
        ("Decentralized Autonomous Organization (DAO) Governance & Voting Engine", "Token-weighted proposal voting system with quadratic voting shields against whale domination and timelock execution.", "Blockchain & Web3", "Intermediate", ["Solidity", "Web3.js / Ethers.js", "React", "JavaScript"], 3.5, 8.9, 8.4),
        ("Cross-Chain Token Bridge with Multi-Sig Relay Relayers", "Relay asset deposits across Layer 1 and Layer 2 testnets with cryptographic signature aggregation.", "Blockchain & Web3", "Advanced", ["Solidity", "Go", "Cryptography", "Docker"], 5.0, 9.7, 9.3),
        ("Decentralized Crowdfunding Platform with Milestone Escrow Release", "Smart contract platform locking investor funds and releasing disbursements only upon verified milestone completion.", "Blockchain & Web3", "Beginner", ["Solidity", "JavaScript", "React", "HTML/CSS"], 3.0, 8.5, 8.0),
    ],
    "Mobile Development": [
        ("Offline-First Expense Tracking & Receipt Scanning Mobile App", "Cross-platform mobile wallet with on-device OCR, category budgets, biometric login, and SQLite sync.", "Mobile Development", "Intermediate", ["Flutter", "Python", "REST APIs", "SQL"], 3.5, 8.9, 8.5),
        ("Habit & Mood Tracking App with Push Reminder Engine", "Interactive mobile mindfulness companion featuring streak gamification, interactive charts, and local notifications.", "Mobile Development", "Beginner", ["React Native", "JavaScript", "HTML/CSS"], 2.5, 8.2, 7.7),
        ("Crowdsourced City Transit & Bus Live Arrival Tracker", "Real-time commuter map plotting GPS bus telemetry, crowd density alerts, and route departure alarms.", "Mobile Development", "Intermediate", ["React Native", "TypeScript", "REST APIs", "WebSockets"], 3.5, 8.8, 8.3),
        ("Outdoor Fitness GPS Running Tracker with Elevation Profiler", "Native fitness tracker recording running routes, split paces, elevation gains, and exporting GPX files.", "Mobile Development", "Intermediate", ["Flutter", "REST APIs", "Data Visualization"], 3.0, 8.6, 8.1),
        ("AR Furniture Room Placement App with Surface Estimation", "Augmented reality mobile application projecting 3D CAD furniture onto living room floors with realistic lighting.", "Mobile Development", "Advanced", ["Swift", "C++", "Computer Vision"], 5.0, 9.4, 9.1),
    ],
    "Internet of Things (IoT)": [
        ("Smart Hydroponic Greenhouse Environmental Controller", "Automated indoor farm monitoring soil pH, ambient humidity, and water EC levels via ESP32 and MQTT broker.", "Internet of Things (IoT)", "Intermediate", ["Arduino / ESP32", "MQTT", "Python", "FastAPI"], 3.5, 9.0, 8.9),
        ("Industrial Machinery Predictive Maintenance Vibration Monitor", "Edge accelerometer sensor node detecting bearing wear and acoustic imbalances with Fourier transforms.", "Internet of Things (IoT)", "Advanced", ["Python", "Arduino / ESP32", "Machine Learning", "Time Series Analysis"], 4.5, 9.4, 9.2),
        ("Air Quality & Wildfire Smoke Neighborhood Sensor Grid", "Particulate matter PM2.5 and CO2 sensor nodes reporting microclimate air quality to an open public map.", "Internet of Things (IoT)", "Beginner", ["Arduino / ESP32", "Python", "Data Visualization", "REST APIs"], 2.5, 8.4, 8.2),
        ("Smart Asset Fleet GPS Telematics & Geofencing Tracker", "Cellular-connected fleet tracker transmitting vehicle OBD-II diagnostic trouble codes and speed violations.", "Internet of Things (IoT)", "Intermediate", ["Python", "Arduino / ESP32", "PostgreSQL", "Docker"], 3.5, 8.9, 8.5),
        ("Home Energy Management Node with Zigbee Appliance Relays", "Measure instantaneous wattage per electrical outlet and automatically disconnect vampire standby loads.", "Internet of Things (IoT)", "Intermediate", ["Arduino / ESP32", "MQTT", "Node.js"], 3.0, 8.7, 8.3),
    ]
}

def generate_all_projects() -> List[Dict]:
    projects = list(PROJECT_TEMPLATES)
    idx = len(projects) + 1

    # First add from detailed domain templates
    for domain, items in DOMAIN_TEMPLATES.items():
        for title, desc, subdomain, difficulty, skills, duration, resume, orig in items:
            p_id = f"proj-{domain[:3].lower()}-{idx:03d}"
            
            # Calculate balanced skill importance
            n_skills = len(skills)
            weights = {}
            eq = round(1.0 / n_skills, 2)
            rem = round(1.0 - (eq * (n_skills - 1)), 2)
            for i, sk in enumerate(skills):
                weights[sk] = eq if i < n_skills - 1 else rem

            # Extract languages, frameworks, tools
            prog_langs = [s for s in skills if s in ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust", "SQL", "Solidity", "Swift", "Kotlin"]]
            if not prog_langs:
                prog_langs = ["Python"]
            
            frameworks = [s for s in skills if s in ["FastAPI", "React", "PyTorch", "TensorFlow", "Scikit-Learn", "LangChain", "OpenCV", "Transformers", "Flutter", "React Native", "Next.js", "Express.js", "Node.js"]]
            tools = [s for s in skills if s in ["Docker", "Kubernetes", "Git", "Linux", "PostgreSQL", "MongoDB", "Redis", "Wireshark", "CI/CD", "Airflow", "Spark"]]
            if not tools:
                tools = ["Git"]

            projects.append({
                "project_id": p_id,
                "title": title,
                "description": desc,
                "domain": domain if domain in [
                    "Artificial Intelligence", "Machine Learning", "Natural Language Processing",
                    "Computer Vision", "Data Science & Analytics", "Web Development", "Mobile Development",
                    "Cloud & DevOps", "Cybersecurity", "Blockchain & Web3", "Internet of Things (IoT)",
                    "FinTech & Quant", "HealthTech & BioInformatics", "EdTech", "Climate & Sustainability",
                    "Robotics & Autonomous Systems"
                ] else "Machine Learning",
                "subdomain": subdomain,
                "difficulty": difficulty,
                "required_skills": skills,
                "skill_importance": weights,
                "programming_languages": prog_langs,
                "frameworks": frameworks,
                "tools": tools,
                "prerequisites": ["Basic programming in " + prog_langs[0], "Fundamental data structures"],
                "estimated_duration": float(duration),
                "dataset_available": True if "Data" in domain or "Learning" in domain or "NLP" in domain or "Vision" in domain else False,
                "dataset_source": f"Public open dataset / benchmark repository for {subdomain}",
                "project_type": f"{difficulty} {domain} Project",
                "career_paths": [f"{domain} Engineer", "Software Engineer", "Technical Specialist"],
                "resume_value": resume,
                "originality_score": orig,
                "learning_outcomes": [
                    f"Hands-on architectural implementation of {subdomain}",
                    f"Production validation and performance profiling",
                    "End-to-end documentation and portfolio demonstration"
                ]
            })
            idx += 1

    # Systematic matrix generator to scale past 260 distinct high-value projects
    # We combine 16 domains with 15 distinct problem patterns
    PATTERNS = [
        ("Anomaly & Outlier Monitoring Engine", "Unsupervised anomaly detection pipeline scoring anomalous behavioral spikes in real time.", "Data Analysis", "Intermediate", 3.5, 8.6, 8.2),
        ("Predictive Forecasting Dashboard", "Multi-horizon time series forecasting system predicting demand variations with confidence intervals.", "Predictive Systems", "Intermediate", 3.5, 8.7, 8.4),
        ("Automated Compliance & Audit Validator", "Automated policy and compliance auditing engine verifying data invariants against regulatory standards.", "Governance Systems", "Intermediate", 3.0, 8.5, 8.1),
        ("Real-Time Telemetry & Alert Streamer", "High-throughput telemetry ingestion service processing events and triggering webhooks upon threshold breaches.", "Streaming Infrastructure", "Intermediate", 4.0, 9.0, 8.6),
        ("Benchmarking & Performance Profiler", "Standardized benchmarking harness evaluating latency, throughput, and accuracy trade-offs.", "System Evaluation", "Advanced", 4.5, 9.2, 9.0),
        ("Interactive Exploratory Visualizer", "Dynamic multi-dimensional exploratory dashboard with interactive brushing, filtering, and exports.", "Data Visualization", "Beginner", 2.5, 7.9, 7.5),
        ("Contextual Recommendation System", "Personalized recommendation system matching users to items using collaborative and content-based filtering.", "Recommender Systems", "Intermediate", 3.5, 9.0, 8.7),
        ("Secure End-to-End Encrypted Data Pipeline", "Cryptographically secured data pipeline with client-side envelope encryption and audit trails.", "Data Security", "Advanced", 4.5, 9.4, 9.1),
        ("Lightweight Edge Model Deployment", "Quantized neural model deployment running inference on resource-constrained embedded devices.", "Edge Computing", "Advanced", 5.0, 9.5, 9.3),
        ("Automated Data Quality & Sanitization Pipeline", "Automated pipeline scanning schema drifts, missing data, and synthetic record generation.", "Data Engineering", "Intermediate", 3.0, 8.6, 8.3),
        ("Multi-Modal Semantic Search Engine", "Vector search engine enabling cross-modal retrieval across technical documentation and codebases.", "Search & Retrieval", "Advanced", 4.5, 9.3, 9.1),
        ("Autonomous Workflow Orchestrator", "Distributed task scheduler managing dependent DAG pipelines with exponential backoff retries.", "Workflow Systems", "Advanced", 4.5, 9.2, 8.9),
        ("Federated Privacy-Preserving Learning", "Distributed machine learning across decentralized nodes without centralizing raw customer datasets.", "Privacy AI", "Advanced", 5.0, 9.7, 9.5),
        ("Gamified Skill Progress Tracker", "Interactive progress and milestone web tracker with streak mechanics and portfolio export.", "User Applications", "Beginner", 2.5, 8.1, 7.6),
        ("Continuous Integration & Automated Test Harness", "Automated CI/CD testing suite performing regression, integration, and load tests on code commits.", "DevOps Automation", "Intermediate", 3.0, 8.8, 8.2),
    ]

    DOMAINS_16 = [
        ("Artificial Intelligence", ["Python", "Machine Learning", "Deep Learning", "PyTorch", "FastAPI"]),
        ("Machine Learning", ["Python", "Pandas", "Scikit-Learn", "Machine Learning", "Feature Engineering"]),
        ("Natural Language Processing", ["Python", "Natural Language Processing", "Transformers", "Hugging Face", "FastAPI"]),
        ("Computer Vision", ["Python", "Computer Vision", "OpenCV", "Deep Learning", "PyTorch"]),
        ("Data Science & Analytics", ["Python", "Pandas", "SQL", "Data Visualization", "Matplotlib & Seaborn"]),
        ("Web Development", ["JavaScript", "React", "Node.js", "Express.js", "HTML/CSS"]),
        ("Mobile Development", ["React Native", "JavaScript", "REST APIs", "HTML/CSS"]),
        ("Cloud & DevOps", ["Docker", "Kubernetes", "Linux", "CI/CD", "Git"]),
        ("Cybersecurity", ["Python", "Network Security", "Linux", "Cryptography", "Wireshark"]),
        ("Blockchain & Web3", ["Solidity", "JavaScript", "Web3.js / Ethers.js", "React"]),
        ("Internet of Things (IoT)", ["Arduino / ESP32", "MQTT", "Python", "FastAPI"]),
        ("FinTech & Quant", ["Python", "Pandas", "Time Series Analysis", "SQL", "Plotly"]),
        ("HealthTech & BioInformatics", ["Python", "Pandas", "Machine Learning", "SQL", "Model Evaluation & Interpretability"]),
        ("EdTech", ["React", "FastAPI", "PostgreSQL", "JavaScript", "Python"]),
        ("Climate & Sustainability", ["Python", "Time Series Analysis", "Pandas", "Machine Learning", "Data Visualization"]),
        ("Robotics & Autonomous Systems", ["ROS (Robot Operating System)", "C++", "Python", "Linux", "OpenCV"]),
    ]

    for dom_name, base_skills in DOMAINS_16:
        for pat_title, pat_desc, pat_sub, pat_diff, pat_dur, pat_res, pat_orig in PATTERNS:
            p_id = f"proj-{dom_name[:3].lower()}-{idx:03d}"
            full_title = f"{dom_name}: {pat_title}"
            full_desc = f"{pat_desc} Tailored specifically for modern {dom_name.lower()} environments and challenges."
            
            # Select skills
            req_skills = list(base_skills)
            if pat_diff == "Advanced" and "Docker" not in req_skills:
                req_skills.append("Docker")
            if pat_diff == "Beginner" and len(req_skills) > 4:
                req_skills = req_skills[:4]

            # Weights
            w = {}
            eq = round(1.0 / len(req_skills), 2)
            for i, sk in enumerate(req_skills):
                w[sk] = eq if i < len(req_skills) - 1 else round(1.0 - eq * (len(req_skills) - 1), 2)

            prog_langs = [s for s in req_skills if s in ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust", "SQL", "Solidity", "Swift", "Kotlin"]]
            if not prog_langs:
                prog_langs = ["Python"]

            frameworks = [s for s in req_skills if s in ["FastAPI", "React", "PyTorch", "TensorFlow", "Scikit-Learn", "LangChain", "OpenCV", "Transformers", "Flutter", "React Native", "Next.js", "Express.js", "Node.js"]]
            tools = [s for s in req_skills if s in ["Docker", "Kubernetes", "Git", "Linux", "PostgreSQL", "MongoDB", "Redis", "Wireshark", "CI/CD", "Airflow", "Spark", "Arduino / ESP32", "ROS (Robot Operating System)"]]
            if not tools:
                tools = ["Git"]

            projects.append({
                "project_id": p_id,
                "title": full_title,
                "description": full_desc,
                "domain": dom_name,
                "subdomain": pat_sub,
                "difficulty": pat_diff,
                "required_skills": req_skills,
                "skill_importance": w,
                "programming_languages": prog_langs,
                "frameworks": frameworks,
                "tools": tools,
                "prerequisites": [f"Basic understanding of {dom_name} concepts", f"Working knowledge of {prog_langs[0]}"],
                "estimated_duration": float(pat_dur),
                "dataset_available": True if "Data" in dom_name or "Learning" in dom_name or "Health" in dom_name or "NLP" in dom_name or "Vision" in dom_name or "Climate" in dom_name or "FinTech" in dom_name else False,
                "dataset_source": f"Open domain repository and benchmark dataset for {dom_name}",
                "project_type": f"{pat_diff} Project",
                "career_paths": [f"{dom_name} Practitioner", "Full Stack Engineer", "Systems Developer"],
                "resume_value": pat_res,
                "originality_score": pat_orig,
                "learning_outcomes": [
                    f"Master core workflows and architectural patterns in {dom_name}",
                    f"Implement real-world algorithms with {', '.join(req_skills[:3])}",
                    "Demonstrate working software with end-to-end testing and documentation"
                ]
            })
            idx += 1

    return projects

if __name__ == "__main__":
    generated = generate_all_projects()
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_file = os.path.join(out_dir, "projects_dataset.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(generated, f, indent=2)
    print(f"Generated {len(generated)} projects successfully at {out_file}")
