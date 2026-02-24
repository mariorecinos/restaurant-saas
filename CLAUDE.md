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
**Date:** 2026-02-23

### Recently Completed
- Payment form fields in Cart (card number, expiry, CVV, cardholder name) — sandbox only, no Stripe calls
- DoorDash address validation before order submission (delivery orders only)
- New API route: `/api/doordash/validate-address`
- Payment Settings placeholder card on merchant settings page
- Fixed DoorDash quote error: removed `pickup_time` field, only send `dropoff_time`
- Image rendering for menu items and restaurant logo (on `dev` branch)

### Known Issues / Tech Debt
- **No rate limiting** on public endpoints (`/api/orders` POST, `/api/doordash/validate-address`)
- **Webhook security** — DoorDash webhook at `/api/doordash/webhook` does not verify signatures
- **Payment form is raw inputs** — Must switch to Stripe Elements before going live (PCI compliance)
- **No error toast on order failure** — `handleSubmit` in Cart silently catches errors
- **Orphaned DoorDash quotes** — Address validation creates real quotes that aren't cleaned up
- **No Next.js middleware** — Auth is per-route in dashboard layout, not centralized

### Up Next
- Stripe Connect onboarding for merchants
- Real payment processing (replace sandbox card fields with Stripe Elements)
- Rate limiting on public API routes
- DoorDash webhook signature verification
- Order confirmation page / email notifications

## Uncommitted Work

As of 2026-02-23, the following changes are on `dev` but NOT yet committed:
- `components/ordering/Cart.tsx` — payment form + address validation
- `app/api/doordash/validate-address/route.ts` — new file
- `app/(dashboard)/dashboard/settings/page.tsx` — Payment Settings card
- `lib/doordash.ts` — removed pickup_time from quote payload
- `prisma/seed.ts` — seed script updates
