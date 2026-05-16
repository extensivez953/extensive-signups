# extensive-signups

SignUpGenius replacement for St John the Apostle Catholic Church safety/security team.

Goal: ad-free, professional, free to run, transferable if Mike steps down.

## Stack

- **Next.js 15** (App Router, TypeScript, Tailwind)
- **Supabase** — Postgres + Google OAuth + email
- **shadcn/ui** — component library
- **Cloudflare Pages** — hosting (planned)

## Project status

Design phase. Interactive UI mockup at [`docs/mockup.html`](docs/mockup.html) — open in any browser.

Full design context: [`docs/CONTEXT.md`](docs/CONTEXT.md).

## Local development

```powershell
# 1. Copy env template
Copy-Item .env.local.example .env.local

# 2. Fill in Supabase credentials from
#    https://supabase.com/dashboard/project/_/settings/api

# 3. Install + run
npm install
npm run dev
```

Open <http://localhost:3000>.

## Deployment

TBD — target is Cloudflare Pages + Supabase managed Postgres. See `docs/CONTEXT.md` for full plan.
