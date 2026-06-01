#!/bin/bash
# Run this after:
#   1. Adding DNS A record: chat → 193.187.129.119
#   2. Creating GitHub repo: github.com/Zulqurnain/nayab (public)
set -e

echo "=== Step 1: SSL Certificate ==="
certbot certonly --nginx \
  -d chat.zulqurnainj.com \
  --non-interactive \
  --agree-tos \
  --email zulqurnainjj@gmail.com

echo "=== Step 2: Enable HTTPS nginx config ==="
CONF=/etc/nginx/sites-available/chat.zulqurnainj.com

# Replace the HTTP-only config with the full HTTPS version
cat > "$CONF" << 'NGINX'
# chat.zulqurnainj.com — Nayab AI Chat
server {
    listen 80;
    listen [::]:80;
    server_name chat.zulqurnainj.com;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://chat.zulqurnainj.com$request_uri; }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name chat.zulqurnainj.com;

    ssl_certificate /etc/letsencrypt/live/chat.zulqurnainj.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.zulqurnainj.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    limit_req zone=chat_ip burst=10 nodelay;
    limit_conn perip 20;
    client_max_body_size 3m;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 120s;
        add_header X-Accel-Buffering no;
        chunked_transfer_encoding on;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control 'public, immutable';
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
}
NGINX

nginx -t && systemctl reload nginx
echo "nginx reloaded with HTTPS"

echo "=== Step 3: Push code to GitHub ==="
cd /root/nayab
GIT_SSH_COMMAND="ssh -i /root/.ssh/github_vps -o StrictHostKeyChecking=no" \
  git push -u origin main

echo "=== Step 4: Verify live site ==="
sleep 3
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://chat.zulqurnainj.com/)
echo "https://chat.zulqurnainj.com/ → HTTP $STATUS"

LLMS=$(curl -s --max-time 5 https://chat.zulqurnainj.com/llms.txt | head -1)
echo "llms.txt: $LLMS"

echo ""
echo "=== DONE ==="
echo "Live at: https://chat.zulqurnainj.com"
echo "Also at: https://zulqurnainj.com/chat"
echo "GitHub:  https://github.com/Zulqurnain/nayab"
