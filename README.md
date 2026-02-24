# 🍽️ RestaurantSaaS

**Stop paying 30% to marketplace apps.** Get your own branded ordering page in minutes — with delivery via DoorDash Drive or pickup — and keep your profits.

![RestaurantSaaS Landing Page](landing_page.png)

---

## 🚀 What It Does

RestaurantSaaS is a platform where independent restaurants can:

- **Sign up and create a branded ordering page** in under 5 minutes
- **Accept delivery orders** powered by DoorDash Drive at a flat fee ($9.75, or $7.00 with tip pass-through) — not 30% commission
- **Accept pickup orders** at $0 delivery fee
- **Track savings** vs. marketplace fees in real time on their dashboard
- **Manage their menu** with a full CRUD builder
- **View analytics** — revenue, top items, busiest days, cumulative savings

## 💰 The Problem

Restaurants on DoorDash, Grubhub, and Uber Eats pay **30% commission** on every order. On a $35 order, that's $10.50 gone — while most restaurants operate on 3–9% margins.

**RestaurantSaaS replaces that** with:
| | Marketplace | RestaurantSaaS |
|---|---|---|
| Delivery fee | 30% of order ($10.50 on $35) | Flat $7.00–$9.75 |
| Pickup fee | ~15% of order | **$0** |
| Monthly savings (200 orders) | — | **$2,100+** |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma 5 |
| Auth | Supabase Auth (SSR cookies) |
| Payments | Stripe (sandbox) |
| Delivery | DoorDash Drive API (sandbox) |
| Styling | Tailwind CSS + shadcn/ui |
| Deployment | [Vercel](https://restaurant-saas-git-main-mariorecinos-projects.vercel.app) |

---

## 📁 Project Structure

```
app/
├── page.tsx                          # Landing page with savings calculator
├── (auth)/
│   ├── sign-up/page.tsx              # Restaurant owner signup
│   └── sign-in/page.tsx              # Restaurant owner sign in
├── (dashboard)/
│   └── dashboard/
│       ├── layout.tsx                # Auth-protected layout with nav
│       ├── page.tsx                  # Live order feed + savings counter
│       ├── menu/page.tsx             # Menu builder (CRUD)
│       ├── settings/page.tsx         # Restaurant profile settings
│       └── analytics/page.tsx        # Monthly savings report
├── order/
│   └── [slug]/page.tsx               # Public customer ordering page
└── api/
    ├── orders/route.ts               # POST/GET orders
    ├── orders/[id]/route.ts          # GET/PATCH single order
    ├── doordash/dispatch/route.ts    # Accept quote → dispatch driver
    ├── doordash/quote/route.ts       # Get delivery quote
    ├── doordash/webhook/route.ts     # DoorDash status webhooks
    ├── doordash/cancel/route.ts      # Cancel delivery
    ├── doordash/validate-address/    # Validate delivery address
    ├── menu/route.ts                 # CRUD menu items
    └── restaurants/route.ts          # Restaurant profile CRUD

lib/
├── prisma.ts                         # Prisma client singleton
├── doordash.ts                       # DoorDash Drive API (JWT signing, quote, accept, cancel)
├── stripe.ts                         # Stripe client
├── utils.ts                          # Fee calculator, formatCents, slugify
└── supabase/
    ├── client.ts                     # Browser Supabase client
    └── server.ts                     # Server Supabase client (SSR cookies)

components/
├── dashboard/                        # OrderCard, OrderFeed, SavingsCounter
├── menu/                             # MenuBuilder
├── ordering/                         # MenuDisplay, Cart
├── landing/                          # SavingsCalculator
└── ui/                               # shadcn/ui primitives
```

---

## 🚗 DoorDash Drive Integration

The platform uses DoorDash Drive's **quote → accept** flow:

1. Customer places a delivery order
2. Restaurant confirms → system creates a DoorDash quote
3. Quote accepted → Dasher dispatched
4. Status updates via webhooks: `confirmed → enroute → pickup → delivered`

**Pricing:**
- Base rate: $9.75 (first 5 miles)
- Tip discount: -$2.75 if tips passed to Dasher
- Minimum fee with tips: **$7.00**

---

## 🏃 Getting Started

### Prerequisites
- Node.js 20+
- Supabase project
- Stripe account (test mode)
- DoorDash Developer Portal access

### Setup

```bash
git clone <repo-url>
cd restaurant-saas
npm install
cp .env.example .env.local
# Fill in your credentials in .env.local
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed Demo Data

```bash
npx prisma db seed
```

This creates **Mario's Pizzeria** with 6 menu items. Visit `/order/marios-pizzeria` to see the ordering page.

### How to Test

1. **Landing Page**: Visit `/` — see the savings calculator, pricing, and CTA sections
2. **Ordering Page**: Visit `/order/marios-pizzeria` (after seeding) — browse menu, add to cart, choose delivery/pickup
3. **Sign Up**: Click "Start Free" → create an account → set up your restaurant in the dashboard
4. **Dashboard**: `/dashboard` — manage menu, view orders, update settings, see analytics
5. **DoorDash Delivery**: From the dashboard, click "Dispatch" on a delivery order to create a DoorDash Drive quote and accept it
6. **Stripe Payments**: Use test card `4242 4242 4242 4242` (any future exp, any CVC)

### DoorDash Webhook Testing

```bash
curl -X POST https://your-url.vercel.app/api/doordash/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_name":"dasher_confirmed","external_delivery_id":"YOUR_DELIVERY_ID","tracking_url":"https://example.com/track"}'
```

---

## 📊 Key Features

- **Savings Calculator** — Interactive widget showing exact savings vs. marketplace fees
- **Real-time Order Feed** — Dashboard updates with incoming orders
- **Menu Builder** — Full CRUD with categories, pricing, availability toggles
- **DoorDash Delivery** — Quote-based dispatch with live tracking
- **Address Validation** — Validates delivery addresses via DoorDash API before checkout
- **Analytics Dashboard** — Revenue, order volume, top items, busiest days
- **Supabase Auth** — Server-side authentication with cookie-based sessions

---

## 📄 License

MIT
