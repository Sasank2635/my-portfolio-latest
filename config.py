"""
config.py — Central configuration for the portfolio.

All personal data, project info, skills, and experience live here.
Edit this file (or override via .env) to customize your portfolio.
"""

from decouple import config


# ── App Settings ──────────────────────────────────────────────
DEBUG = config("DEBUG", "false").lower() == "true"
HOST = config("HOST", "0.0.0.0")
PORT = int(config("PORT", 8000))

# ── Personal ──────────────────────────────────────────────────
SITE_TITLE = config("SITE_TITLE", "Portfolio — Backend · DevOps · Data Analyst")
YOUR_NAME = config("YOUR_NAME", "Sasanka Sekhar Upadhyaya")
YOUR_TITLE = config("YOUR_TITLE", "Software Engineer · Backend · DevOps · Data Analyst")
YOUR_EMAIL = config("YOUR_EMAIL", "sasanka.sekhar.upadhyaya2002@gmail.com")
YOUR_LOCATION = config("YOUR_LOCATION", "Kolkata, India")

# ── Social Links ──────────────────────────────────────────────
SOCIAL_LINKS = {
    "github": config("GITHUB_URL", "https://github.com/Sasank2635"),
    "linkedin": config("LINKEDIN_URL", "https://linkedin.com/in/yourprofile"),  # TODO: replace
    "twitter": config("TWITTER_URL", "https://x.com/upadhyaya2002"),       # TODO: replace
}

# ── SMTP (Contact Form) ──────────────────────────────────────
SMTP_HOST = config("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(config("SMTP_PORT", 587))
SMTP_USER = config("SMTP_USER", "")
SMTP_PASSWORD = config("SMTP_PASSWORD", "")
CONTACT_RECIPIENT = config("CONTACT_RECIPIENT", YOUR_EMAIL)

# ── Hero Metrics ──────────────────────────────────────────────
METRICS = [
    {"value": 4, "label": "Projects Shipped", "suffix": "+"},
    {"value": 99, "label": "Uptime Delivered", "suffix": "%"},
    {"value": 1, "label": "Years Experience", "suffix": "+"},
]

# ── About Cards ───────────────────────────────────────────────
ABOUT_CARDS = [
    {
        "icon": "🔧",
        "theme": "backend",
        "title": "Backend Development",
        "desc": "Production REST APIs, microservices, async systems with FastAPI, Django REST, RabbitMQ, and Celery",
    },
    {
        "icon": "⚙️",
        "theme": "devops",
        "title": "DevOps Engineering",
        "desc": "CI/CD pipelines, container orchestration with Docker & Kubernetes, cloud deployments on AWS & Azure",
    },
    {
        "icon": "📊",
        "theme": "data",
        "title": "Data Analysis",
        "desc": "Hands-on experience in SQL, Python, and Excel for analyzing large datasets, identifying trends, and generating business insights",
    },
    {
        "icon": "📈",
        "theme": "analytics",
        "title": "Business Analytics",
        "desc": "KPI tracking, root cause analysis, and experiment design (A/B testing) to solve real-world business problems",
    },
]

# ── Skills ────────────────────────────────────────────────────
SKILLS = [
    {
        "icon": "⚙️",
        "title": "DevOps & Cloud",
        "tags": [
            "Docker", "AWS", "Azure",
            "GitHub Actions", "Linux", "CI/CD", "Containerization"
        ],
    },
    {
        "icon": "🔧",
        "title": "Backend & Data",
        "tags": [
            "Python", "FastAPI", "Django REST", "PostgreSQL",
            "MySQL", "Redis", "RabbitMQ", "Celery",
            "Microservices", "REST", "JavaScript", "Bash",
        ],
    },
    {
        "icon": "📊",
        "title": "Data Analysis",
        "tags": [
            "SQL", "Python", "Pandas", "NumPy",
            "scikit-learn", "XGBoost", "Excel", "EDA",
            "Data Cleaning", "Data Validation", "Data Visualization"
        ],
    },
    {
        "icon": "📈",
        "title": "Analytics & Statistics",
        "tags": [
            "KPI Tracking", "Root Cause Analysis",
            "A/B Testing", "Hypothesis Testing",
            "Descriptive Statistics", "Data Interpretation"
        ],
    },
    {
        "icon": "⚙️",
        "title": "Tools & Systems",
        "tags": [
            "Power BI", "Tableau", "MySQL",
            "PostgreSQL", "REST APIs", "Git",
            "Linux"
        ],
    },
]

# ── Projects ──────────────────────────────────────────────────
PROJECTS = [
    {
        "number": "01",
        "title": "Production-Grade Distributed LLM Backend",
        "desc": (
            "Cloud-agnostic distributed system with producer–consumer "
            "architecture, priority queues, DLQ, retries, and exponential "
            "backoff for async LLM job processing. Validated under 1000+ "
            "concurrent jobs with full fault-tolerance."
        ),
        "tech": ["Python", "FastAPI", "Redis", "RabbitMQ", "Celery", "Docker", "Linux"],
        "link": "https://llm-async-backend-system-wn2jtbqdzpanat3eh5a6jj.streamlit.app/",
    },
    {
        "number": "02",
        "title": "Food Delivery Analytics & Demand Optimization",
        "desc": (
            "End-to-end analytics project on 10K+ food delivery orders to analyze "
            "delivery performance and demand patterns. Identified peak-hour delays "
            "(30–40%) using SQL and Python, performed root cause analysis on order "
            "volume and distance, and designed an A/B experiment to optimize delivery "
            "partner allocation. Built dashboard-ready datasets and visualizations "
            "to track KPIs like delivery time and demand trends."
        ),
        "tech": ["Python", "SQL", "Pandas", "Matplotlib", "Power BI"],
        "link": "https://github.com/Sasank2635/food-delivery-analysis",
    },
    {
        "number": "03",
        "title": "Real-Time UPI Fraud Detection & Risk Scoring System",
        "desc": (
            "Production-style ML system to detect fraudulent UPI transactions in real time. "
            "Features a modular pipeline: feature engineering, YAML-driven rule engine, "
            "dual ML models (Logistic Regression + XGBoost), and a risk scoring layer "
            "with ALLOW/REVIEW/DECLINE decisions. Handles class imbalance and optimizes "
            "PR-AUC with top-K fraud capture at 1%, 5%, and 10% thresholds."
        ),
        "tech": ["Python", "FastAPI", "XGBoost", "scikit-learn", "Pandas", "NumPy", "pytest"],
        "link": "https://github.com/Sasank2635/real-time-upi-fraud-detection",
    },
    {
        "number": "04",
        "title": "Cloud-Native CI/CD Deployment Pipeline",
        "desc": (
            "End-to-end CI/CD pipelines deploying on Kubernetes with rolling "
            "updates, canary releases, auto-scaling, and integrated monitoring "
            "across AWS and Azure."
        ),
        "tech": ["AWS", "Azure", "Containerization", "GitHub Actions", "Linux"],
        "link": "#",
    },
]

# ── Experience ────────────────────────────────────────────────
EXPERIENCE = [
    {
        "date": "Oct 2024 — Present",
        "role": "Software Engineer",
        "company": "Cozentus Technologies Pvt. Ltd. — Bhubaneswar",
        "desc": (
            "Built production REST APIs with FastAPI and Django REST handling "
            "500+ documents/day. Deployed containerized services on Docker & "
            "Kubernetes. Reduced release cycles by 60% with GitHub Actions & "
            "Jenkins CI/CD. Optimized PostgreSQL queries reducing API latency "
            "by 40%. Worked extensively with SQL and Python for data validation, analysis"
            "and debugging across backend systems, improving data accuracy and reliability."
        ),
    },
]