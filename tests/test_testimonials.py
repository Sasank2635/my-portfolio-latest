"""
tests/test_testimonials.py — storage, moderation, and API for testimonials.

Run with: pytest tests/ -v
"""

from typing import ClassVar

import pytest
from fastapi.testclient import TestClient

import config
from api import routes
from api import testimonials as tm
from app import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    # Arrange: force the SQLite backend at a throwaway path + known admin token.
    original = tm.DB_PATH
    tm.set_database_url("")  # ensure tests never hit a real Postgres
    tm.set_db_path(str(tmp_path / "testimonials.db"))
    tm.init_db()
    monkeypatch.setattr(config, "ADMIN_TOKEN", "secret-token")
    routes._SUBMIT_TIMES.clear()
    yield
    tm.set_db_path(original)


# ── Storage layer ─────────────────────────────────────────
class TestStorage:
    def test_new_testimonial_starts_pending(self):
        tid = tm.create_testimonial("Asha", "PM · Acme", "Great to work with.")
        assert tid > 0
        assert tm.list_approved() == []
        pending = tm.list_pending()
        assert len(pending) == 1
        assert pending[0]["name"] == "Asha"

    def test_approve_moves_pending_to_approved(self):
        tid = tm.create_testimonial("Asha", "PM · Acme", "Great to work with.")
        assert tm.approve(tid) is True
        assert len(tm.list_approved()) == 1
        assert tm.list_pending() == []

    def test_approve_unknown_id_returns_false(self):
        assert tm.approve(999) is False

    def test_delete_removes_testimonial(self):
        tid = tm.create_testimonial("Asha", "PM · Acme", "Great to work with.")
        assert tm.delete(tid) is True
        assert tm.list_pending() == []


# ── Public submission endpoint ────────────────────────────
class TestSubmit:
    VALID: ClassVar[dict] = {
        "name": "Ravi",
        "role": "CTO · Startup",
        "message": "Shipped our backend fast and reliably.",
    }

    def test_valid_submission_is_stored_pending_not_published(self):
        res = client.post("/api/testimonials", json=self.VALID)
        assert res.status_code == 200
        assert res.json()["success"] is True
        assert len(tm.list_pending()) == 1
        assert tm.list_approved() == []  # never auto-published

    def test_short_message_is_rejected(self):
        res = client.post(
            "/api/testimonials",
            json={"name": "Ravi", "role": "CTO", "message": "hi"},
        )
        assert res.status_code == 422

    def test_honeypot_blocks_bots(self):
        res = client.post(
            "/api/testimonials",
            json={**self.VALID, "website": "http://spam.example"},
        )
        assert res.status_code == 422
        assert tm.list_pending() == []

    def test_rate_limited_after_max(self):
        for _ in range(3):
            assert client.post("/api/testimonials", json=self.VALID).status_code == 200
        assert client.post("/api/testimonials", json=self.VALID).status_code == 429


# ── Admin moderation endpoints ────────────────────────────
class TestAdmin:
    HEADERS: ClassVar[dict] = {"X-Admin-Token": "secret-token"}

    def test_pending_requires_token(self):
        assert client.get("/api/testimonials/pending").status_code == 403

    def test_pending_lists_with_token(self):
        tm.create_testimonial("Asha", "PM", "Great work overall here.")
        res = client.get("/api/testimonials/pending", headers=self.HEADERS)
        assert res.status_code == 200
        assert len(res.json()["testimonials"]) == 1

    def test_approve_requires_token(self):
        tid = tm.create_testimonial("Asha", "PM", "Great work overall here.")
        assert client.post(f"/api/testimonials/{tid}/approve").status_code == 403

    def test_approve_with_token_publishes(self):
        tid = tm.create_testimonial("Asha", "PM", "Great work overall here.")
        res = client.post(f"/api/testimonials/{tid}/approve", headers=self.HEADERS)
        assert res.status_code == 200
        assert len(tm.list_approved()) == 1

    def test_approve_unknown_returns_404(self):
        res = client.post("/api/testimonials/999/approve", headers=self.HEADERS)
        assert res.status_code == 404

    def test_delete_with_token(self):
        tid = tm.create_testimonial("Asha", "PM", "Great work overall here.")
        res = client.delete(f"/api/testimonials/{tid}", headers=self.HEADERS)
        assert res.status_code == 200
        assert tm.list_pending() == []


# ── Rendering ─────────────────────────────────────────────
class TestRender:
    def test_approved_testimonial_renders_on_homepage(self):
        tid = tm.create_testimonial(
            "Asha Rao", "Engineering Lead · Acme", "Absolutely stellar engineer."
        )
        tm.approve(tid)
        html = client.get("/").text
        assert "Absolutely stellar engineer." in html
        assert "Asha Rao" in html

    def test_pending_testimonial_not_on_homepage(self):
        tm.create_testimonial(
            "Hidden Person", "Role", "This should not be visible yet."
        )
        html = client.get("/").text
        assert "This should not be visible yet." not in html


# ── Admin moderation page ─────────────────────────────────
class TestAdminPage:
    HEADERS: ClassVar[dict] = {"X-Admin-Token": "secret-token"}

    def test_admin_page_is_served(self):
        res = client.get("/admin")
        assert res.status_code == 200
        assert "Moderation" in res.text
        assert "admin.js" in res.text

    def test_list_all_requires_token(self):
        assert client.get("/api/testimonials/all").status_code == 403

    def test_list_all_returns_pending_and_approved(self):
        tm.create_testimonial("A", "Role", "A pending testimonial here.")
        approved_id = tm.create_testimonial("B", "Role", "An approved testimonial here.")
        tm.approve(approved_id)
        res = client.get("/api/testimonials/all", headers=self.HEADERS)
        assert res.status_code == 200
        statuses = {t["status"] for t in res.json()["testimonials"]}
        assert statuses == {"pending", "approved"}
