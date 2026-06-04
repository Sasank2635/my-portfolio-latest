"""
api/routes.py — API endpoints for the portfolio.

Handles the contact form submission with validation and
optional SMTP email delivery.
"""

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
    try:
        # Build email
        subject = f"Portfolio Contact: {data.name}"
        body = (
            f"New message from your portfolio contact form\n"
            f"{'=' * 50}\n\n"
            f"Name:    {data.name}\n"
            f"Email:   {data.email}\n"
            f"Date:    {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n\n"
            f"Message:\n{data.message}\n"
        )

        # Try sending via SMTP if credentials are configured
        if config.SMTP_USER and config.SMTP_PASSWORD:
            await _send_email(subject, body, data.email)
            logger.info(f"Contact email sent from {data.email}")
        else:
            # No SMTP configured — log the message instead
            logger.info(
                f"Contact form submission (SMTP not configured):\n{body}"
            )

        return ContactResponse(
            success=True,
            message="Message sent successfully! I'll get back to you soon.",
        )

    except Exception as e:
        logger.error(f"Contact form error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send message. Please try again later.",
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
