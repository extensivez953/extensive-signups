# Extensive Signups

SignUpGenius replacement for St John the Apostle Catholic Church safety/security team. Mass scheduling, Google OAuth, ad-free.

## Status

**Design phase.** Interactive HTML mockup at `mockup.html`. No code yet.

## Why

Existing tool is SignUpGenius. Two problems:
1. Ad-laden — post-signup confirmation page shoves car insurance + Fabletics popups in users' faces immediately after they commit to volunteer
2. Costs $10+/mo to remove ads at any reasonable tier

This is the church's tool, not personal. Needs to keep running indefinitely whether or not Mike is involved.

## Deployment target

**NOT on the home server.** Goes on Cloud Run + Supabase so it survives Mike stepping down from the team. GCP project will be transferable.

## Stack

- **Frontend**: SvelteKit or Next.js + shadcn/ui, hosted on Cloudflare Pages (free)
- **Backend**: Supabase (free tier — Postgres + auth + email)
- **Auth**: Google OAuth (most members on Gmail/Workspace)
- **Domain**: `signup.extensive.cloud` (or church subdomain later)

## Cost

$0/month at this scale. Supabase free tier (500MB DB, 50K MAU) and Cloudflare Pages free tier cover 50 team members forever.

## Data model (draft)

- `events` — a signup period (e.g. "Mass Signups: 16-17 and 23-24 May 2026")
- `masses` — individual Mass times within an event (Sat 4pm, Sun 7:30am, etc.)
- `slots` — roles per Mass (Team Lead, Medic, Team Member) with capacity
- `signups` — who filled which slot, with optional comment + display name override
- `members` — known team roster, Google-auth'd

## Workflow

**Admin (Matt Dooley):**
1. Creates event, picks Masses (template = "Standard Weekend" → Sat 4pm + Sun 7:30/9:15/11)
2. Sets capacity per role
3. Configures reminder schedule (default 48h + 24h before each Mass)
4. Configures gap-alert recipients + trigger (default Matt, 72h before unfilled Mass)
5. "Send Invites" → emails everyone in roster with personalized magic link

**Member:**
1. Gets email from Matt
2. Clicks → Google OAuth (one click, stays signed in)
3. Sees grid of Masses × roles
4. Clicks open slot → add comment → confirm
5. Gets confirmation email with iCal attachment + cancel-my-spot link

## Features in mockup

- Login (Google OAuth)
- Dashboard (open invitations + upcoming commitments + year stats)
- Event grid (the SignUpGenius equivalent, clean)
- Signup modal (with comment + alt display name support)
- Thank you page (ad-free, with calendar download)
- Admin events list (current + past, "Use as template" button)

## Not in scope for v1

- Swap requests ("can someone cover for me?")
- Push notifications
- Mobile app (responsive web only)
- Multiple teams
- Member-to-member messaging

## Open questions

- GitHub repo name: `extensivez953/extensive-signups`?
- Does the church already own a domain to use a subdomain of?
- Who else should be admin besides Matt?
- Branding — church logo/colors needed before launch
