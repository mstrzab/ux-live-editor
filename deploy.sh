#!/bin/bash
# UX Live Editor - Deploy Script
# Run this on your server after SSH access is configured

set -e

APP_DIR="/opt/ux-live-editor"
REPO="https://github.com/mstrzab/ux-live-editor.git"
BRANCH="master"

echo "=== UX Live Editor Deploy ==="

# Install Node.js 20 if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Node: $(node -v), NPM: $(npm -v)"

# Install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    apt-get install -y postgresql postgresql-contrib
fi

# Setup database
echo "Setting up database..."
sudo -u postgres psql -c "CREATE USER uxlive WITH PASSWORD 'uxlive_secret';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE ux_live_editor OWNER uxlive;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ux_live_editor TO uxlive;" 2>/dev/null || true

# Clone or pull repo
if [ -d "$APP_DIR" ]; then
    echo "Updating existing installation..."
    cd $APP_DIR
    git pull origin $BRANCH
else
    echo "Cloning repository..."
    git clone -b $BRANCH $REPO $APP_DIR
    cd $APP_DIR
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env if not exists
if [ ! -f .env ]; then
    echo "Creating .env..."
    cat > .env << 'EOF'
DATABASE_URL="postgresql://uxlive:uxlive_secret@localhost:5432/ux_live_editor"
NEXTAUTH_SECRET="$(openssl rand -hex 32)"
NEXTAUTH_URL="http://YOUR_DOMAIN:3000"
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
EOF
    echo "⚠️  Edit .env with your settings!"
fi

# Run migrations
echo "Running database migrations..."
npx prisma migrate dev --name init --skip-seed

# Build
echo "Building application..."
npm run build

# Setup systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/ux-live-editor.service << EOF
[Unit]
Description=UX Live Editor
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=$(which npm) start
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ux-live-editor
systemctl restart ux-live-editor

echo "=== Deploy complete! ==="
echo "App running at: http://YOUR_IP:3000"
echo "Edit /etc/systemd/system/ux-live-editor.service for custom settings"
