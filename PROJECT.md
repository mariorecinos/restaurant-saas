# 🍽️ Restaurant SaaS Platform — Claude Code Agent Instructions

## Project Overview
We are building a SaaS platform where restaurants sign up, get their own branded ordering page, and allow customers to place orders for **delivery via DoorDash Drive** or **pickup** — without paying marketplace commissions (no 30% Grubhub/DoorDash/Uber fees).

## The One-Liner
> A SaaS platform where restaurants sign up, get their own branded ordering page in minutes, and offer customers delivery (via DoorDash Drive) or pickup — without paying marketplace commissions.

---

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (Postgres)
- **ORM:** Prisma
- **Auth:** Supabase Auth
- **Payments:** Stripe (sandbox for MVP)
- **Delivery:** DoorDash Drive API (sandbox)
- **Styling:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel

---

## Folder Structure to Generate

```
app/
├── page.tsx                          # Landing page with savings calculator
├── (auth)/
│   ├── sign-up/page.tsx              # Restaurant owner signup
│   └── sign-in/page.tsx             # Restaurant owner sign in
├── (dashboard)/
│   └── dashboard/
│       ├── page.tsx                  # Live order feed + savings counter
│       ├── menu/page.tsx             # Menu builder (add/edit/delete items)
│       ├── settings/page.tsx         # Restaurant profile, address, logo
│       └── analytics/page.tsx        # Monthly savings report, revenue stats
├── order/
│   └── [slug]/
│       └── page.tsx                  # Public customer ordering page
└── api/
    ├── orders/
    │   ├── route.ts                  # POST create order, GET list orders
    │   └── [id]/route.ts            # GET single order, PATCH update status
    ├── doordash/
    │   ├── dispatch/route.ts         # POST trigger DoorDash Drive delivery
    │   └── webhook/route.ts          # POST receive DoorDash status updates
    ├── menu/
    │   └── route.ts                  # GET/POST/PATCH/DELETE menu items
    └── restaurants/
        └── route.ts                  # GET/POST/PATCH restaurant profile

lib/
├── prisma.ts                         # Prisma client singleton
├── doordash.ts                       # DoorDash Drive API helper functions
├── stripe.ts                         # Stripe client singleton
└── utils.ts                          # Fee calculator, savings calculator

prisma/
└── schema.prisma                     # All Prisma models (see below)

components/
├── ui/                               # shadcn/ui primitives
├── dashboard/
│   ├── OrderCard.tsx                 # Single order card with confirm/cancel
│   ├── OrderFeed.tsx                 # Real-time list of incoming orders
│   └── SavingsCounter.tsx            # Animated cumulative savings display
├── menu/
│   └── MenuBuilder.tsx              # Add/edit/remove menu items UI
├── ordering/
│   ├── MenuDisplay.tsx              # Customer-facing menu grid
│   └── Cart.tsx                     # Cart sidebar with delivery/pickup toggle
└── landing/
    └── SavingsCalculator.tsx         # Interactive fee savings calculator
```

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Restaurant {
  id           String     @id @default(cuid())
  name         String
  slug         String     @unique
  address      String
  phone        String
  logo         String?
  ownerId      String     @unique
  stripeKey    String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  menuItems    MenuItem[]
  orders       Order[]
}

model MenuItem {
  id           String     @id @default(cuid())
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
  name         String
  description  String?
  price        Int        # in cents
  category     String
  available    Boolean    @default(true)
  image        String?
  createdAt    DateTime   @default(now())
}

model Order {
  id               String      @id @default(cuid())
  restaurantId     String
  restaurant       Restaurant  @relation(fields: [restaurantId], references: [id])
  customerName     String
  customerPhone    String
  customerAddress  String?     # null for pickup orders
  fulfillment      Fulfillment @default(DELIVERY)
  items            Json        # Array of {menuItemId, name, price, quantity}
  subtotal         Int         # in cents
  deliveryFee      Int         @default(0)   # actual DoorDash Drive fee in cents
  marketplaceFee   Int         @default(0)   # what they would have paid at 30% in cents
  savings          Int         @default(0)   # marketplaceFee - deliveryFee
  tip              Int         @default(0)   # in cents
  status           OrderStatus @default(PENDING)
  stripePaymentId  String?
  ddDeliveryId     String?     # DoorDash delivery ID
  ddTrackingUrl    String?     # DoorDash tracking URL for customer
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
}

enum Fulfillment {
  DELIVERY
  PICKUP
}

enum OrderStatus {
  PENDING
  CONFIRMED
  DRIVER_ASSIGNED
  PICKED_UP
  DELIVERED
  CANCELLED
}
```

---

## Environment Variables Needed

```bash
# .env.local
DATABASE_URL=                        # Supabase Postgres connection string
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=                   # Stripe sandbox secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe sandbox publishable key
STRIPE_WEBHOOK_SECRET=

DOORDASH_DEVELOPER_ID=               # From DoorDash Developer Portal
DOORDASH_KEY_ID=                     # From DoorDash Developer Portal
DOORDASH_SIGNING_SECRET=             # From DoorDash Developer Portal

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## DoorDash Drive Integration

### How It Works
When a restaurant confirms a DELIVERY order, call DoorDash Drive API to dispatch a driver.

### Dispatch Call (`lib/doordash.ts`)
```
POST https://openapi.doordash.com/drive/v2/deliveries

Body:
{
  external_delivery_id: order.id,
  pickup_address: restaurant.address,
  pickup_business_name: restaurant.name,
  pickup_phone_number: restaurant.phone,
  pickup_instructions: `Order #${order.id}`,
  dropoff_address: order.customerAddress,
  dropoff_contact_given_name: order.customerName,
  dropoff_contact_phone_number: order.customerPhone,
  order_value: order.subtotal,       // in cents
  tip: order.tip                     // passing tip gets $2.75 discount on base rate
}
```

### DoorDash Pricing Logic
```
Base rate:     $9.75 (first 5 miles)
Per mile:      $0.75 (after 5 miles, up to 15 miles max)
Tip discount:  -$2.75 if tip is passed through to Dasher

So minimum delivery fee = $7.00 with tip
```

### Webhook Events to Handle (`/api/doordash/webhook`)
```
dasher_confirmed    → update order status to DRIVER_ASSIGNED
dasher_picked_up    → update order status to PICKED_UP
delivered           → update order status to DELIVERED
delivery_cancelled  → update order status to CANCELLED
```

---

## Fee Savings Calculator Logic (`lib/utils.ts`)

```typescript
export function calculateFees(subtotalCents: number, fulfillment: 'DELIVERY' | 'PICKUP') {
  const marketplaceFee = Math.round(subtotalCents * 0.30)  // 30% marketplace rate

  let deliveryFee = 0
  if (fulfillment === 'DELIVERY') {
    deliveryFee = 975  // $9.75 base — assume within 5 miles for MVP
  }
  // PICKUP = $0 delivery fee (vs marketplace still charging ~15%)

  const savings = marketplaceFee - deliveryFee

  return {
    subtotal: subtotalCents,
    marketplaceFee,   // what they would have paid
    deliveryFee,      // what they actually pay
    savings,          // the hero number
  }
}
```

---

## Customer Ordering Flow

1. Customer visits `yourapp.com/order/[restaurant-slug]`
2. Sees restaurant menu, selects delivery or pickup
3. Adds items to cart
4. Enters name, phone, and delivery address (if delivery)
5. Pays via Stripe Checkout
6. Order created in DB with status `PENDING`
7. Restaurant sees order appear in dashboard in real time
8. Restaurant clicks **Confirm**
9. If DELIVERY → DoorDash Drive API called → driver dispatched
10. If PICKUP → restaurant prepares, customer comes in
11. Status updates flow back via DoorDash webhooks

---

## Dashboard — Key Metrics to Show

```
Hero Numbers (top of dashboard):
- 💰 Saved this month:     $847
- 💰 Saved since joining:  $4,231
- 📦 Orders today:         12
- 📦 Orders this month:    203

Order Feed:
- Live incoming orders (PENDING status) — need confirmation
- In-progress orders (CONFIRMED, DRIVER_ASSIGNED, PICKED_UP)
- Completed orders (DELIVERED, PICKUP complete)

Each order card shows:
- Customer name + fulfillment type (🚗 Delivery / 🏪 Pickup)
- Items ordered
- Subtotal + delivery fee
- Savings on this order vs. marketplace
- DoorDash tracking link (if delivery)
- Status badge
- Confirm / Cancel buttons (if PENDING)
```

---

## Analytics Page — Monthly Report (Owner.com Style)

```
This Month:
- Total revenue processed
- Total orders
- Delivery orders vs. pickup orders
- Total fees paid (Drive fees)
- Total saved vs. marketplace fees  ← hero number
- Average order value
- Busiest day of week
- Top 5 selling menu items

Trend chart: monthly savings over time (recharts)
```

---

## Landing Page Sections

1. **Hero** — Headline + savings calculator widget
2. **Social proof** — "Restaurants save an average of $2,400/month"
3. **How it works** — 3 steps: Sign up → Build menu → Start taking orders
4. **Features** — Your ordering page, DoorDash delivery, pickup orders, dashboard, monthly report
5. **Pricing** — Free (50 orders/mo) / Growth $79/mo / Pro $149/mo
6. **FAQ** — Common objections answered
7. **CTA** — Calculator + "Start free, no credit card required"

### Savings Calculator Widget
Inputs: monthly orders, average order value, primary platform
Output: current fees paid, fees with our platform, monthly savings, yearly savings

---

## Build Order for Claude Code

Follow this exact sequence — each layer depends on the previous:

1. `npx create-next-app@latest` with TypeScript, Tailwind, App Router
2. Install dependencies: `prisma`, `@prisma/client`, `@supabase/supabase-js`, `stripe`, `shadcn/ui`, `recharts`
3. `prisma/schema.prisma` — define all models
4. `lib/prisma.ts` — singleton
5. `lib/utils.ts` — fee calculator
6. `lib/doordash.ts` — Drive API helper
7. `lib/stripe.ts` — Stripe client
8. API routes — orders, doordash, menu, restaurants
9. Dashboard components — OrderCard, OrderFeed, SavingsCounter
10. Menu components — MenuBuilder
11. Ordering components — MenuDisplay, Cart
12. Landing components — SavingsCalculator
13. Pages — dashboard, menu, settings, analytics, order/[slug], sign-up, sign-in
14. Landing page — page.tsx
15. `.env.local` template
16. Deploy to Vercel

---

## Key Business Rules

- **Pickup orders = $0 delivery fee** (restaurants keep everything minus Stripe processing ~2.9%)
- **Delivery orders = flat DoorDash Drive fee** (~$9.75, shown transparently to restaurant)
- **Savings = 30% marketplace fee minus actual Drive fee** — calculated and stored on every order
- **Restaurant slug** must be unique, URL-safe, auto-generated from restaurant name on signup
- **DoorDash sandbox** is used for MVP — no real drivers dispatched
- **Stripe sandbox** is used for MVP — no real payments processed

---

## Notes for Claude Code

- Use **server components** by default, client components only where interactivity is needed (cart, calculator, order feed polling)
- Use **Supabase Realtime** on the dashboard order feed so new orders appear without refresh
- Use **JWT authentication** via Supabase Auth — protect all `/dashboard` routes with middleware
- Keep components small and single-responsibility
- All monetary values stored in **cents** (integers), display as dollars in UI
- DoorDash API requires **JWT signing** — implement in `lib/doordash.ts`
- This is a **hackathon MVP** — prioritize working end-to-end flow over perfect polish
