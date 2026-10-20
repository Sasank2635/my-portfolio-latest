"""
api/testimonials.py — testimonial storage with moderation.

Dual backend: uses PostgreSQL when DATABASE_URL is set (e.g. on Render),
and falls back to a local SQLite file otherwise (dev + tests). Submissions
are saved as 'pending' and only surface once an admin approves them.
"""

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

DB_PATH = os.environ.get("TESTIMONIALS_DB", "testimonials.db")
DATABASE_URL = os.environ.get("DATABASE_URL", "")

STATUS_PENDING = "pending"
STATUS_APPROVED = "approved"


def set_db_path(path: str) -> None:
    """Point the SQLite backend at a different file (tests/startup)."""
    global DB_PATH
    DB_PATH = path


def set_database_url(url: str) -> None:
    """Set the Postgres connection URL (empty string = use SQLite)."""
    global DATABASE_URL
    DATABASE_URL = url or ""


def _use_postgres() -> bool:
    return DATABASE_URL.startswith(("postgres://", "postgresql://"))


@contextmanager
def _connect():
    """Yield (connection, placeholder) for the active backend."""
    if _use_postgres():
        import psycopg
        from psycopg.rows import dict_row

        conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
        try:
            yield conn, "%s"
            conn.commit()
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            yield conn, "?"
            conn.commit()
        finally:
            conn.close()


def init_db() -> None:
    """Create the testimonials table if it does not exist (idempotent)."""
    if _use_postgres():
        ddl = (
            "CREATE TABLE IF NOT EXISTS testimonials ("
            " id SERIAL PRIMARY KEY,"
            " name TEXT NOT NULL, role TEXT NOT NULL, message TEXT NOT NULL,"
            " status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL)"
        )
    else:
        ddl = (
            "CREATE TABLE IF NOT EXISTS testimonials ("
            " id INTEGER PRIMARY KEY AUTOINCREMENT,"
            " name TEXT NOT NULL, role TEXT NOT NULL, message TEXT NOT NULL,"
            " status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL)"
        )
    with _connect() as (conn, _ph):
        conn.execute(ddl)


def create_testimonial(name: str, role: str, message: str) -> int:
    """Insert a new pending testimonial; returns its row id."""
    created_at = datetime.now(tz=timezone.utc).isoformat()
    values = (name, role, message, STATUS_PENDING, created_at)
    with _connect() as (conn, ph):
        cols = f"({ph}, {ph}, {ph}, {ph}, {ph})"
        sql = (
            "INSERT INTO testimonials (name, role, message, status, created_at) "
            f"VALUES {cols}"
        )
        if _use_postgres():
            cur = conn.execute(sql + " RETURNING id", values)
            return cur.fetchone()["id"]
        cur = conn.execute(sql, values)
        return cur.lastrowid


def _list_by_status(status: str) -> list[dict]:
    with _connect() as (conn, ph):
        rows = conn.execute(
            "SELECT id, name, role, message, created_at FROM testimonials "
            f"WHERE status = {ph} ORDER BY created_at DESC",
            (status,),
        ).fetchall()
    return [dict(row) for row in rows]


def list_approved() -> list[dict]:
    """Return approved testimonials, newest first (safe for public display)."""
    return _list_by_status(STATUS_APPROVED)


def list_pending() -> list[dict]:
    """Return testimonials awaiting approval, newest first (admin only)."""
    return _list_by_status(STATUS_PENDING)


def list_all() -> list[dict]:
    """Return every testimonial (pending first, then approved), newest first."""
    with _connect() as (conn, _ph):
        rows = conn.execute(
            "SELECT id, name, role, message, status, created_at FROM testimonials "
            "ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC"
        ).fetchall()
    return [dict(row) for row in rows]


def approve(testimonial_id: int) -> bool:
    """Mark a testimonial as approved; returns False if the id is unknown."""
    with _connect() as (conn, ph):
        cur = conn.execute(
            f"UPDATE testimonials SET status = {ph} WHERE id = {ph}",
            (STATUS_APPROVED, testimonial_id),
        )
        return cur.rowcount > 0


def delete(testimonial_id: int) -> bool:
    """Delete a testimonial; returns False if the id is unknown."""
    with _connect() as (conn, ph):
        cur = conn.execute(
            f"DELETE FROM testimonials WHERE id = {ph}", (testimonial_id,)
        )
        return cur.rowcount > 0
