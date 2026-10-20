"""
app.py — FastAPI application entry point.

Serves the portfolio frontend via Jinja2 templates and
exposes API endpoints for the contact form.
"""

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import config
from api import testimonials
from api.routes import router as api_router

# ── App Init ──────────────────────────────────────────────────
app = FastAPI(
    title=config.SITE_TITLE,
    docs_url="/docs" if config.DEBUG else None,
    redoc_url=None,
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Jinja2 templates
templates = Jinja2Templates(directory="templates")

# Register API routes
app.include_router(api_router, prefix="/api")

# Initialize the testimonials database
# (Postgres when DATABASE_URL is set — e.g. on Render — otherwise local SQLite)
testimonials.set_database_url(config.DATABASE_URL)
testimonials.set_db_path(config.TESTIMONIALS_DB)
testimonials.init_db()


# ── Pages ─────────────────────────────────────────────────────
@app.api_route("/", methods=["GET", "HEAD"], response_class=HTMLResponse)
async def index(request: Request):
    """Render the main portfolio page."""
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "site_title": config.SITE_TITLE,
            "name": config.YOUR_NAME,
            "title": config.YOUR_TITLE,
            "email": config.YOUR_EMAIL,
            "location": config.YOUR_LOCATION,
            "social": config.SOCIAL_LINKS,
            "metrics": config.METRICS,
            "about_cards": config.ABOUT_CARDS,
            "skills": config.SKILLS,
            "orbit_skills": config.ORBIT_SKILLS,
            "projects": config.PROJECTS,
            "experience": config.EXPERIENCE,
            "testimonials": testimonials.list_approved(),
        },
    )


# ── Admin (testimonials moderation UI) ────────────────────────
@app.get("/admin", response_class=HTMLResponse)
async def admin(request: Request):
    """Serve the moderation UI. Every action requires the admin token in-page."""
    return templates.TemplateResponse("admin.html", {"request": request})


# ── Health Check ──────────────────────────────────────────────
@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    return JSONResponse(content={"status": "ok", "service": "portfolio"})


# ── Run ───────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
    )
