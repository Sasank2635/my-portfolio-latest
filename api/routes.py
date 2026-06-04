"""
api/routes.py — API endpoints for the portfolio.

Handles the contact form submission with validation and
optional SMTP email delivery.
"""

import asyncio
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

import config

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Models ────────────────────────────────────────────────────
class ContactRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    message: str = Field(..., min_length=10, max_length=5000)


class ContactResponse(BaseModel):
    success: bool
    message: str


# ── Contact Form Endpoint ────────────────────────────────────
@router.post("/contact", response_model=ContactResponse)
async def contact(data: ContactRequest):
    """
    Handle contact form submissions.

    - Validates the input
    - Sends an email via SMTP (if configured)
    - Falls back to logging if SMTP is not set up
    """
    # Build the email body
    subject = f"Portfolio Contact: {data.name}"
    body = (
        f"New message from your portfolio contact form\n"
        f"{'=' * 50}\n\n"
        f"Name:    {data.name}\n"
        f"Email:   {data.email}\n"
        f"Date:    {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n\n"
        f"Message:\n{data.message}\n"
    )

    # Always log the submission first so a message is never lost even if
    # SMTP is broken or unreachable.
    logger.info(f"Contact form submission from {data.email} ({data.name})")
    logger.info(f"Message body:\n{body}")

    # Fire-and-forget the SMTP send with a hard 6-second timeout. The user
    # gets an instant success response on a slow / wrong / unreachable mail
    # server — we just lose the delivery, not the message itself (it's in
    # the log).
    if config.SMTP_USER and config.SMTP_PASSWORD:
        async def _send_with_timeout():
            try:
                await asyncio.wait_for(
                    _send_email(subject, body, data.email),
                    timeout=6.0,
                )
                logger.info(f"Email delivered for {data.email}")
            except asyncio.TimeoutError:
                logger.error(
                    f"SMTP send timed out (>6s) for {data.email}. "
                    f"Check SMTP_HOST / SMTP_PORT / network reachability."
                )
            except Exception as exc:
                logger.error(f"SMTP send failed for {data.email}: {exc!r}")

        asyncio.create_task(_send_with_timeout())
    else:
        logger.info("SMTP not configured — message saved to server log only.")

    return ContactResponse(
        success=True,
        message="Message sent successfully! I'll get back to you soon.",
    )


async def _send_email(subject: str, body: str, reply_to: str):
    """Send an email using aiosmtplib."""
    import aiosmtplib

    msg = MIMEMultipart()
    msg["From"] = config.SMTP_USER
    msg["To"] = config.CONTACT_RECIPIENT
    msg["Subject"] = subject
    msg["Reply-To"] = reply_to
    msg.attach(MIMEText(body, "plain"))

    await aiosmtplib.send(
        msg,
        hostname=config.SMTP_HOST,
        port=config.SMTP_PORT,
        username=config.SMTP_USER,
        password=config.SMTP_PASSWORD,
        use_tls=False,
        start_tls=True,
    )


# ── Resume (view-only, inline) ───────────────────────────────
from pathlib import Path
from fastapi.responses import FileResponse

RESUME_PATH = (
    Path(__file__).resolve().parent.parent
    / "static" / "resume"
    / "Sasanka_Sekhar_Upadhyaya_Software_Engineer_Resume.pdf"
)


@router.get("/resume")
async def resume():
    """
    Serve the resume PDF inline (view, not download).

    The browser's PDF plugin still surfaces its own download button — that
    cannot be fully suppressed without rendering the PDF to canvas via JS.
    Setting Content-Disposition: inline at least defaults the behaviour to
    "open in viewer" rather than "save dialog".
    """
    if not RESUME_PATH.exists():
        raise HTTPException(status_code=404, detail="Resume not found.")

    return FileResponse(
        path=str(RESUME_PATH),
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'inline; filename="resume.pdf"',
            "Cache-Control": "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        },
    )
