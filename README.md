# Portfolio — DevOps · Backend · Agentic AI

A professional portfolio website with a Python (FastAPI) backend and a hand-crafted HTML/CSS/JS frontend featuring interactive particle systems, scroll animations, a terminal emulator, and a working contact form.

---

## Project Structure

```
portfolio/
├── app.py                  # FastAPI application entry point
├── config.py               # Configuration & environment variables
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
├── api/
│   ├── __init__.py
│   └── routes.py           # API route handlers (contact form, etc.)
├── templates/
│   └── index.html          # Main HTML template (Jinja2)
├── static/
│   ├── css/
│   │   └── style.css       # All styles — layout, components, animations
│   ├── js/
│   │   ├── main.js         # App bootstrap, scroll reveals, counters
│   │   ├── particles.js    # Canvas particle system + mouse interaction
│   │   ├── terminal.js     # Terminal typing animation
│   │   └── contact.js      # Contact form AJAX handler
│   └── images/
│       └── (your assets)
└── README.md
```

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/yourusername/portfolio.git
cd portfolio
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your details (name, email, social links, SMTP creds)
```

### 3. Run development server

```bash
uvicorn app:app --reload --port 8000
```

Open [http://localhost:8000](http://localhost:8000)

---

## Production Deployment

### Docker

```bash
docker build -t portfolio .
docker run -p 8000:8000 --env-file .env portfolio
```

### Gunicorn + Nginx

```bash
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

Then reverse-proxy with Nginx.

---

## Customization

All personal data is driven by `config.py` and `.env`. Edit those to change:

- Your name, title, bio
- Social links
- Skills, projects, experience
- Contact form email recipient
- Color theme (CSS variables in `style.css`)

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Python 3.11+, FastAPI, Uvicorn      |
| Templating | Jinja2                              |
| Frontend   | Vanilla HTML5, CSS3, JavaScript ES6 |
| Email      | SMTP (configurable)                 |
| Deploy     | Docker, Gunicorn, Nginx             |

---

## License

MIT — use freely, credit appreciated.
