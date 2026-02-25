# Restaurant SaaS — Project Guide

## Branch Strategy
- Branch off `dev`: `claude/<name>` or `adal/<name>`
- PR into `dev`, merge when builds pass
- `dev` → `main` for production deploy
- Never push directly to `main` or `dev`

## Communication
Claude and Adal coordinate through:
1. **This file** — read at session start
2. **`git log main --oneline`** — see what the other agent did
3. **PR/commit descriptions** — explain the why

## Stack
Next.js 16, React 19, TypeScript, Prisma, Supabase (Postgres + Auth + Realtime), DoorDash Drive API, Stripe (sandbox), shadcn/ui, Tailwind, Recharts, Vercel.

## Key Files
- `lib/doordash.ts` — DoorDash Drive API (quote, accept, cancel, status)
- `lib/utils.ts` — pricing logic, formatCents, calculateSavings
- `lib/auth.ts` — getAuthenticatedOwner()
- `lib/rate-limit.ts` — in-memory rate limiter (per-IP)
- `lib/turnstile.ts` — Cloudflare Turnstile server-side verification
- `components/ordering/Cart.tsx` — customer checkout (address validation, payment form, Turnstile)
- `components/dashboard/OrderFeed.tsx` — real-time order feed (Supabase Realtime)
- `components/dashboard/OrderCard.tsx` — order card with live DoorDash tracking panel
- `app/api/doordash/` — quote, dispatch, cancel, status, validate-address, webhook
- `app/api/orders/` — create + list orders (Zod validated, rate limited)
- `prisma/schema.prisma` — Restaurant, MenuItem, Order models

## Current Status
**Last updated by:** Claude
**Date:** 2026-02-24

### Recently Completed
- Cloudflare Turnstile anti-bot on checkout (client + server)
- Live DoorDash tracking panel on order cards (Adal)
- Rate limiting + Zod validation on public API routes (Adal)
- Analytics: correct DoorDash Drive cost calculation (Adal)
- Webhook: Authorization header check for DoorDash secret
- PII logging gated behind NODE_ENV check
- Payment form fields on Cart (sandbox, no Stripe calls)
- Address validation via DoorDash quote before order submission

### Known Issues / Tech Debt
- Rate limiter uses in-memory Map — resets per Vercel function invocation (needs Redis for real enforcement)
- Payment form is raw inputs — needs Stripe Elements before going live (PCI compliance)
- No error toast shown to customer on order failure
- Orphaned DoorDash quotes from address validation (not cleaned up)
- No Next.js middleware — auth is per-route in dashboard layout

### Up Next
- Stripe Connect onboarding for merchants
- Real payment processing (Stripe Elements)
- Order confirmation page / email notifications
