#!/usr/bin/env bash
# deploy.sh — Automated deployment script for the portfolio
# Usage: bash deploy.sh [setup|deploy|restart|logs|ssl]

set -euo pipefail

# ── Configuration ─────────────────────────────────────────
APP_NAME="portfolio"
APP_DIR="/var/www/portfolio"
APP_USER="www-data"
REPO_URL="https://github.com/yourusername/portfolio.git"
BRANCH="main"
DOMAIN="yourdomain.com"
PORT=8000
WORKERS=4

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1" && exit 1; }

# ── Commands ──────────────────────────────────────────────

cmd_setup() {
    log "Setting up server for ${APP_NAME}..."

    # System packages
    log "Installing system dependencies..."
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git curl

    # App directory
    log "Creating app directory..."
    sudo mkdir -p "$APP_DIR"
    sudo chown "$USER:$USER" "$APP_DIR"

    # Clone repo
    if [ -d "$APP_DIR/.git" ]; then
        log "Repository already exists, pulling latest..."
        cd "$APP_DIR" && git pull origin "$BRANCH"
    else
        log "Cloning repository..."
        git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    fi

    cd "$APP_DIR"

    # Virtual environment
    log "Setting up Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    pip install gunicorn

    # Environment file
    if [ ! -f .env ]; then
        cp .env.example .env
        warn "Created .env from template — edit it with your settings!"
    fi

    # Systemd service
    log "Creating systemd service..."
    sudo tee /etc/systemd/system/${APP_NAME}.service > /dev/null <<EOF
[Unit]
Description=${APP_NAME} Portfolio
After=network.target

[Service]
Type=notify
User=$USER
Group=$USER
WorkingDirectory=${APP_DIR}
Environment="PATH=${APP_DIR}/venv/bin"
ExecStart=${APP_DIR}/venv/bin/gunicorn app:app \\
    --workers ${WORKERS} \\
    --worker-class uvicorn.workers.UvicornWorker \\
    --bind 127.0.0.1:${PORT} \\
    --access-logfile /var/log/${APP_NAME}/access.log \\
    --error-logfile /var/log/${APP_NAME}/error.log
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

    # Log directory
    sudo mkdir -p /var/log/${APP_NAME}
    sudo chown "$USER:$USER" /var/log/${APP_NAME}

    # Nginx config
    log "Configuring Nginx..."
    sudo cp nginx.conf /etc/nginx/sites-available/${APP_NAME}
    sudo ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx

    # Enable & start
    sudo systemctl daemon-reload
    sudo systemctl enable ${APP_NAME}
    sudo systemctl start ${APP_NAME}

    success "Setup complete!"
    echo ""
    log "Next steps:"
    echo "  1. Edit ${APP_DIR}/.env with your settings"
    echo "  2. Update ${DOMAIN} in nginx.conf"
    echo "  3. Run: bash deploy.sh ssl"
    echo "  4. Run: bash deploy.sh restart"
}

cmd_deploy() {
    log "Deploying latest code..."
    cd "$APP_DIR"

    git pull origin "$BRANCH"
    source venv/bin/activate
    pip install -r requirements.txt

    sudo systemctl restart ${APP_NAME}
    success "Deployed and restarted!"

    # Verify health
    sleep 2
    if curl -sf http://127.0.0.1:${PORT}/health > /dev/null; then
        success "Health check passed ✓"
    else
        error "Health check failed! Check logs: bash deploy.sh logs"
    fi
}

cmd_restart() {
    log "Restarting ${APP_NAME}..."
    sudo systemctl restart ${APP_NAME}
    sudo systemctl restart nginx
    success "Restarted!"
}

cmd_logs() {
    log "Showing logs (Ctrl+C to exit)..."
    sudo journalctl -u ${APP_NAME} -f --no-pager
}

cmd_ssl() {
    log "Setting up SSL with Let's Encrypt..."
    sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}
    success "SSL configured!"
}

cmd_status() {
    echo ""
    log "Service status:"
    sudo systemctl status ${APP_NAME} --no-pager
    echo ""
    log "Nginx status:"
    sudo systemctl status nginx --no-pager
    echo ""
    log "Health check:"
    if curl -sf http://127.0.0.1:${PORT}/health; then
        echo ""
        success "Service is healthy"
    else
        echo ""
        error "Service is not responding"
    fi
}

# ── Main ──────────────────────────────────────────────────
case "${1:-help}" in
    setup)   cmd_setup   ;;
    deploy)  cmd_deploy  ;;
    restart) cmd_restart ;;
    logs)    cmd_logs    ;;
    ssl)     cmd_ssl     ;;
    status)  cmd_status  ;;
    *)
        echo ""
        echo "Usage: bash deploy.sh <command>"
        echo ""
        echo "Commands:"
        echo "  setup    — First-time server setup (packages, venv, systemd, nginx)"
        echo "  deploy   — Pull latest code & restart"
        echo "  restart  — Restart app + nginx"
        echo "  logs     — Tail application logs"
        echo "  ssl      — Set up Let's Encrypt SSL"
        echo "  status   — Check service health"
        echo ""
        ;;
esac
