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
SITE_TITLE = config("SITE_TITLE", "Portfolio — Backend · DevOps · Agentic AI")
YOUR_NAME = config("YOUR_NAME", "Sasanka Sekhar Upadhyaya")
YOUR_TITLE = config("YOUR_TITLE", "Software Engineer · Backend · DevOps · Agentic AI")
YOUR_EMAIL = config("YOUR_EMAIL", "sasanka.sekhar.upadhyaya2002@gmail.com")
YOUR_LOCATION = config("YOUR_LOCATION", "Kolkata, India")

# ── Social Links ──────────────────────────────────────────────
SOCIAL_LINKS = {
    "github": config("GITHUB_URL", "https://github.com/yourusername"),       # TODO: replace
    "linkedin": config("LINKEDIN_URL", "https://linkedin.com/in/yourprofile"),  # TODO: replace
    "twitter": config("TWITTER_URL", "https://twitter.com/yourhandle"),       # TODO: replace
}

# ── SMTP (Contact Form) ──────────────────────────────────────
SMTP_HOST = config("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(config("SMTP_PORT", 587))
SMTP_USER = config("SMTP_USER", "")
SMTP_PASSWORD = config("SMTP_PASSWORD", "")
CONTACT_RECIPIENT = config("CONTACT_RECIPIENT", YOUR_EMAIL)

# ── Hero Metrics ──────────────────────────────────────────────
METRICS = [
    {"value": 10, "label": "Projects Shipped", "suffix": "+"},
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
        "icon": "🤖",
        "theme": "ai",
        "title": "Agentic AI",
        "desc": "Autonomous agents, multi-agent orchestration, RAG pipelines, and LLM tool-use with LangChain & LangGraph",
    },
]

# ── Skills ────────────────────────────────────────────────────
SKILLS = [
    {
        "icon": "⚙️",
        "title": "DevOps & Cloud",
        "tags": [
            "Docker", "Kubernetes", "AWS", "Azure",
            "GitHub Actions", "Jenkins", "Linux", "CI/CD",
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
        "icon": "🤖",
        "title": "AI & ML",
        "tags": [
            "LangChain", "LangGraph", "CrewAI", "OpenAI API",
            "Claude API", "RAG", "ChromaDB", "Pinecone",
            "Function Calling", "Multi-Agent Systems",
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
        "tech": ["Python", "FastAPI", "Redis", "RabbitMQ", "Celery", "Docker", "Kubernetes"],
        "link": "#",
    },
    {
        "number": "02",
        "title": "Agentic AI Task Orchestration Platform",
        "desc": (
            "Autonomous multi-agent system with tool-use chains and RAG "
            "pipeline (ChromaDB) for context-aware, domain-grounded responses. "
            "Stateful LangGraph workflows with conditional branching, retries, "
            "and human-in-the-loop checkpoints."
        ),
        "tech": ["Python", "LangChain", "LangGraph", "FastAPI", "ChromaDB", "OpenAI API", "Docker"],
        "link": "#",
    },
    {
        "number": "03",
        "title": "Cloud-Native CI/CD Deployment Pipeline",
        "desc": (
            "End-to-end CI/CD pipelines deploying on Kubernetes with rolling "
            "updates, canary releases, auto-scaling, and integrated monitoring "
            "across AWS and Azure."
        ),
        "tech": ["AWS", "Azure", "Kubernetes", "GitHub Actions", "Jenkins"],
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
            "by 40%. Developed Agentic AI pipelines with LLM APIs, tool-use "
            "chains, RAG, and multi-agent orchestration via LangChain/LangGraph."
        ),
    },
]