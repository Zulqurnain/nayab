# Cloudflare Setup Guide for Nayab

This document explains how to put Cloudflare in front of chat.zulqurnainj.com for CDN, DDoS protection, and edge caching.

## Steps

### 1. Add site to Cloudflare
1. Log in to https://dash.cloudflare.com
2. Click **Add a Site**, enter `zulqurnainj.com`
3. Select the **Free** plan (sufficient for this workload)
4. Cloudflare will scan your existing DNS records

### 2. Update nameservers
Replace your registrar's nameservers with the two Cloudflare nameservers shown in the dashboard.

### 3. DNS records
Ensure these records exist:
| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A    | chat | YOUR_VPS_IP | Proxied (orange cloud) |

### 4. SSL/TLS settings
- Go to **SSL/TLS → Overview** → set to **Full (strict)**
- This means Cloudflare → your server uses HTTPS (our nginx has a valid Let's Encrypt cert)

### 5. Caching rules
Nayab uses server-sent events (SSE) for streaming — Cloudflare must NOT cache `/api/chat`.

Go to **Rules → Cache Rules** and add:

**Rule 1 — Never cache API routes:**
- If: URI path starts with `/api`
- Then: Cache status = **Bypass**

**Rule 2 — Cache static assets:**
- If: URI path starts with `/_next/static`
- Then: Cache status = **Cache Everything**, Edge TTL = 1 year

### 6. Performance settings
- **Speed → Optimization**: Enable Auto Minify (JS, CSS, HTML)
- **Speed → Optimization**: Enable Brotli compression

### 7. Security settings
- **Security → WAF**: Enable managed rules (free tier includes basic protection)
- **Security → Bots**: Enable **Bot Fight Mode** (free)
- **Security → DDoS**: Enabled by default

### 8. Disable nginx rate limiting if using Cloudflare
Cloudflare provides its own rate limiting. You can remove the `limit_req` and `limit_conn` directives from nginx if Cloudflare is fully proxying all traffic.

## Notes
- SSE (streaming) works through Cloudflare with **HTTP/2** — ensure your server supports it
- Cloudflare free tier has a 100MB upload limit — our API already enforces 3MB
- Real user IP: Cloudflare sends `CF-Connecting-IP` header — nginx already passes `X-Forwarded-For`
