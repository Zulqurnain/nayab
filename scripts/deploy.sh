#!/usr/bin/env bash
# Layer 5: Zero-downtime deploy script for Nayab
# Usage: ./scripts/deploy.sh [branch]
set -euo pipefail

BRANCH="${1:-main}"
APP_DIR="/root/nayab"
LOG_DIR="/var/log/nayab"
DATA_DIR="/var/data"

echo "[deploy] Starting Nayab deploy at $(date '+%Y-%m-%d %H:%M:%S')"
echo "[deploy] Branch: $BRANCH"

# Ensure directories exist
mkdir -p "$LOG_DIR" "$DATA_DIR" /var/backups/nayab

cd "$APP_DIR"

# Pull latest code
echo "[deploy] Pulling from git..."
GIT_SSH_COMMAND="ssh -i /root/.ssh/github_vps -o StrictHostKeyChecking=no" \
  git pull origin "$BRANCH"

# Install dependencies
echo "[deploy] Installing dependencies..."
npm ci --omit=dev --ignore-scripts=false 2>&1 | tail -5

# Stop offllama to free memory for build
echo "[deploy] Stopping offllama-server to free memory..."
pm2 stop offllama-server 2>/dev/null || true

# Build
echo "[deploy] Building Next.js app..."
NODE_OPTIONS="--max-old-space-size=512" npm run build

# Copy standalone assets
echo "[deploy] Copying static assets..."
cp -r public/. .next/standalone/public/ 2>/dev/null || true
cp -r .next/static/. .next/standalone/.next/static/ 2>/dev/null || true

# Restart app with PM2 (graceful reload for zero downtime)
echo "[deploy] Reloading PM2 (zero downtime)..."
pm2 reload nayab --update-env || pm2 restart nayab

# Restart offllama
echo "[deploy] Restarting offllama-server..."
pm2 start offllama-server 2>/dev/null || true

# Save PM2 process list
pm2 save

echo "[deploy] Deploy complete at $(date '+%Y-%m-%d %H:%M:%S')"

# Health check
echo "[deploy] Checking health..."
sleep 3
STATUS=$(curl -sf http://127.0.0.1:3002/api/v1/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo "unknown")
echo "[deploy] Health: $STATUS"

if [ "$STATUS" = "down" ]; then
  echo "[deploy] WARNING: app reports 'down' — check logs"
  exit 1
fi

echo "[deploy] All done!"
