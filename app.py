"""
app.py — FastAPI application entry point.

Serves the portfolio frontend via Jinja2 templates and
exposes API endpoints for the contact form.
"""

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

import config
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


# ── Pages ─────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
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
            "projects": config.PROJECTS,
            "experience": config.EXPERIENCE,
        },
    )


# ── Health Check ──────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "portfolio"}


# ── Run ───────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
    )
