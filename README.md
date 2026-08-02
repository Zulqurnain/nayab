# Nayab

A free AI chat app — a public demo of [offLLama](https://github.com/Zulqurnain/offllama)
(self-hosted `llama.cpp` inference), with paid-tier fallback to OpenAI/Anthropic and
Gumroad license verification for upgrades.

**Live at:** [zulqurnainj.com/chat](https://zulqurnainj.com/chat)

---

## Architecture

- Next.js 15, deployed as a standalone build, run via PM2 (`nayab`, port 3002)
- Served from **`zulqurnainj.com/chat`**, not a dedicated subdomain — the app's
  `next.config.ts` sets `basePath: "/chat"`, which is why every route (including
  `robots.txt`/`sitemap.xml`) lives under that path prefix rather than at the app's
  own root.
- Reverse-proxied by nginx as part of the main `zulqurnainj.com` server block, not its
  own nginx site.
- SQLite database at `DB_PATH` (`/var/data/nayab.db` in production).
- Auth: NextAuth (`NEXTAUTH_SECRET`/`NEXTAUTH_URL`).

## AI inference

Two tiers:
- **Free**: [offLLama](https://github.com/Zulqurnain/offllama), a self-hosted
  `llama.cpp` server (`OFFLLAMA_URL`, defaults to `http://127.0.0.1:8080` — needs to be
  running separately for the free tier to work).
- **Paid**: OpenAI or Anthropic, gated behind a Gumroad license check
  (`GUMROAD_PRODUCT_ID`).

## Environment variables

See `.env.example` for the full list (copy to `.env.local`, never commit the real
file). Notably:
- `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` should be `https://zulqurnainj.com/chat` —
  **not** a `chat.zulqurnainj.com` subdomain. A `chat.zulqurnainj.com` subdomain did
  exist briefly (created via an incomplete migration attempt) but was retired
  2026-08-02 since its own root 404'd (the hardcoded `/chat` basePath meant the
  subdomain's bare root, and its own `robots.txt`/`llms.txt`/`sitemap.xml`, never
  worked) and the app was already correctly running at `zulqurnainj.com/chat` the
  whole time regardless.
- `ALLOWED_ORIGINS` (CORS allowlist) is **not currently set** in the live
  `.env.local` — the app falls back to a hardcoded default in
  `src/lib/auth-middleware.ts`. Consider actually setting this explicitly in
  production rather than relying on the code fallback.
- `NEXTAUTH_SECRET` must be a real generated value in production
  (`openssl rand -base64 32`) — the example file's placeholder is not safe to use
  as-is.

## Deployment

`.github/workflows/deploy.yml` — push to `main` triggers an SSH deploy: `git pull`,
`npm ci`, `npm run build` (memory-capped via `NODE_OPTIONS`), copies `public/` and
`.next/static/` into the standalone build output, then `pm2 reload nayab`. It also
briefly stops/restarts `offllama-server` around the build.

## Public static files (`public/`)

`robots.txt`, `llms.txt`, `sitemap.xml`, `index.md` are all served under the app's
`/chat` basePath. A byte-identical duplicate of these lives at
`/var/www/nayab-static/` on the VPS, aliased in from the *main* `zulqurnainj.com`
site's own `/chat/{robots.txt,llms.txt,sitemap.xml,index.md}` routes — if you change
one copy, change the other, or write a small script/step to keep them in sync
automatically.
