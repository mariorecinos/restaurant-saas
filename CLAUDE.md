# Restaurant SaaS — Project Guide

## Branch Strategy

```
main (production, deployed to Vercel)
 └── dev (integration branch)
      ├── claude/<feature-name>   ← Claude's work
      └── adal/<feature-name>     ← Adal's work
```

### Rules
- **Never push directly to `main` or `dev`** — always use feature branches + PRs
- Branch off `dev` for all new work
- Name branches: `claude/<short-description>` or `adal/<short-description>`
- Open PRs into `dev`, merge once builds pass
- When `dev` is stable, PR into `main` for production deploy
- Write clear commit messages and PR descriptions so the other agent can follow along

## Communication

We (Claude and Adal) are two AI agents working on this project with the same user (Marito). We can't talk directly, so we coordinate through:

1. **This file (CLAUDE.md)** — Read this at the start of every session for context
2. **Git history** — Check `git log dev --oneline` to see what the other has done
3. **PR descriptions** — Detailed summaries of what changed and why
4. **STATUS section below** — Updated by whoever worked last

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Prisma + Supabase (Postgres) for database and auth
- DoorDash Drive API for delivery
- Stripe (sandbox, not yet wired up) for payments
- shadcn/ui + Tailwind for UI
- Recharts for analytics
- Deployed on Vercel

## Project Structure

```
app/
  (auth)/           — sign-in, sign-up pages
  (dashboard)/      — merchant dashboard (orders, menu, analytics, settings)
  api/              — API routes (orders, menu, restaurants, doordash)
  order/[slug]/     — public customer ordering page
components/
  dashboard/        — OrderFeed, OrderCard, SavingsCounter
  landing/          — SavingsCalculator
  menu/             — MenuBuilder
  ordering/         — MenuDisplay, Cart
  ui/               — shadcn/ui primitives
lib/
  auth.ts           — getAuthenticatedOwner() helper
  doordash.ts       — DoorDash Drive API (quote, accept, cancel, status)
  prisma.ts         — Prisma client singleton
  stripe.ts         — Stripe client init
  supabase/         — browser + server Supabase clients
  utils.ts          — pricing logic, formatCents, slugify
prisma/
  schema.prisma     — Restaurant, MenuItem, Order models
  seed.ts           — Demo data seeder
```

## Key Business Logic

- Restaurants avoid 30% marketplace fees by using their own ordering page
- DoorDash Drive handles delivery: $9.75/delivery (or $7.00 with tip pass-through)
- Customer delivery fees are configurable per restaurant (base/reduced/free tiers)
- Savings = 30% marketplace fee - DoorDash Drive cost

## Current Status

**Last updated by:** Claude
**Date:** 2026-02-24

### Recently Completed
- Payment form fields in Cart (card number, expiry, CVV, cardholder name) — sandbox only, no Stripe calls
- DoorDash address validation before order submission (delivery orders only)
- New API route: `/api/doordash/validate-address`
- Payment Settings + Restaurant Billing placeholder cards on merchant settings page
- Fixed DoorDash quote error: removed `pickup_time` field, only send `dropoff_time`
- Image rendering for menu items and restaurant logo (on `dev` branch)
- **Webhook security**: added `DOORDASH_WEBHOOK_SECRET` shared secret header check to `/api/doordash/webhook`
- **PII logging fix**: gated full payload logging in `lib/doordash.ts` behind `NODE_ENV !== 'production'`
- Added `DOORDASH_WEBHOOK_SECRET` to `.env.example`

### Grader Feedback Summary (93/100 — A)
The following issues were flagged. Status noted for each:
1. ✅ Webhook/enum mismatch — **Not an issue**: schema.prisma already has all statuses
2. ✅ Stripe API version — **Not an issue**: `2026-01-28.clover` is SDK-required version
3. ✅ Webhook security — **Fixed**: shared secret header check added
4. ✅ PII logging — **Fixed**: gated behind NODE_ENV check
5. ⏳ Rate limiting on public endpoints — still open
6. ⏳ Idempotency keys on order creation/dispatch — still open
7. ⏳ Zod input validation on API routes — still open
8. ⏳ Payment form → Stripe Elements (PCI compliance) — still open

### Known Issues / Tech Debt
- **No rate limiting** on public endpoints (`/api/orders` POST, `/api/doordash/validate-address`)
- **Payment form is raw inputs** — Must switch to Stripe Elements before going live (PCI compliance)
- **No error toast on order failure** — `handleSubmit` in Cart silently catches errors
- **Orphaned DoorDash quotes** — Address validation creates real quotes that aren't cleaned up
- **No Next.js middleware** — Auth is per-route in dashboard layout, not centralized
- **No Zod validation** — API route inputs are unvalidated

### Up Next
- Stripe Connect onboarding for merchants
- Real payment processing (replace sandbox card fields with Stripe Elements)
- Rate limiting on public API routes
- Order confirmation page / email notifications

## Uncommitted Work

As of 2026-02-24, the following changes are on `dev` but NOT yet committed:
- `components/ordering/Cart.tsx` — payment form + address validation
- `app/api/doordash/validate-address/route.ts` — new file
- `app/(dashboard)/dashboard/settings/page.tsx` — Payment Settings + Billing cards
- `lib/doordash.ts` — removed pickup_time, gated PII logging
- `app/api/doordash/webhook/route.ts` — webhook shared secret check
- `.env.example` — added DOORDASH_WEBHOOK_SECRET
- `prisma/seed.ts` — seed script updates
