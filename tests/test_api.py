"""
tests/test_api.py — Tests for portfolio API endpoints.

Run with: pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient

from app import app

client = TestClient(app)


# ── Health Check ──────────────────────────────────────────
class TestHealth:
    def test_health_returns_ok(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "portfolio"


# ── Homepage ──────────────────────────────────────────────
class TestHomepage:
    def test_homepage_renders(self):
        response = client.get("/")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

    def test_homepage_contains_nav(self):
        response = client.get("/")
        assert "nav" in response.text

    def test_homepage_contains_sections(self):
        response = client.get("/")
        for section in ["about", "skills", "projects", "experience", "contact"]:
            assert f'id="{section}"' in response.text

    def test_homepage_loads_scripts(self):
        response = client.get("/")
        assert "particles.js" in response.text
        assert "terminal.js" in response.text
        assert "main.js" in response.text
        assert "contact.js" in response.text


# ── Contact API ───────────────────────────────────────────
class TestContactAPI:
    def test_valid_contact_submission(self):
        payload = {
            "name": "Test User",
            "email": "test@example.com",
            "message": "Hello, this is a test message for the portfolio.",
        }
        response = client.post("/api/contact", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_missing_name_returns_422(self):
        payload = {
            "email": "test@example.com",
            "message": "Hello, this is a test message.",
        }
        response = client.post("/api/contact", json=payload)
        assert response.status_code == 422

    def test_invalid_email_returns_422(self):
        payload = {
            "name": "Test User",
            "email": "not-an-email",
            "message": "Hello, this is a test message.",
        }
        response = client.post("/api/contact", json=payload)
        assert response.status_code == 422

    def test_short_message_returns_422(self):
        payload = {
            "name": "Test User",
            "email": "test@example.com",
            "message": "Hi",
        }
        response = client.post("/api/contact", json=payload)
        assert response.status_code == 422

    def test_empty_body_returns_422(self):
        response = client.post("/api/contact", json={})
        assert response.status_code == 422


# ── Static Files ──────────────────────────────────────────
class TestStaticFiles:
    def test_css_loads(self):
        response = client.get("/static/css/style.css")
        assert response.status_code == 200

    def test_js_main_loads(self):
        response = client.get("/static/js/main.js")
        assert response.status_code == 200

    def test_js_particles_loads(self):
        response = client.get("/static/js/particles.js")
        assert response.status_code == 200

    def test_js_terminal_loads(self):
        response = client.get("/static/js/terminal.js")
        assert response.status_code == 200

    def test_js_contact_loads(self):
        response = client.get("/static/js/contact.js")
        assert response.status_code == 200


# ── Resume Endpoint ───────────────────────────────────────
class TestResume:
    def test_resume_endpoint_exists(self):
        response = client.get("/api/resume")
        assert response.status_code == 200
