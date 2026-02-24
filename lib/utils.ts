import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// DoorDash Drive cost to the restaurant (not shown to customer)
export function getDoorDashCost(passTip: boolean, tipCents: number): number {
  if (!passTip || tipCents <= 0) return 975 // $9.75 base
  return 700 // $7.00 with tip pass-through
}

// Customer-facing delivery fee set by the restaurant
export interface DeliveryFeeConfig {
  deliveryFee: number      // base fee in cents (default 499)
  reducedFee: number       // reduced fee in cents (default 299)
  reducedFeeMin: number    // subtotal threshold for reduced fee (default 3500)
  freeDeliveryMin: number  // subtotal threshold for free delivery (default 10000, 0 = never)
}

export function calculateCustomerDeliveryFee(
  subtotalCents: number,
  fulfillment: "DELIVERY" | "PICKUP",
  config: Partial<DeliveryFeeConfig>
): number {
  if (fulfillment === "PICKUP") return 0

  const fee = config.deliveryFee ?? 499
  const reduced = config.reducedFee ?? 299
  const reducedMin = config.reducedFeeMin ?? 3500
  const freeMin = config.freeDeliveryMin ?? 10000

  if (freeMin > 0 && subtotalCents >= freeMin) {
    return 0
  }
  if (reducedMin > 0 && subtotalCents >= reducedMin) {
    return reduced
  }
  return fee
}

// Calculate savings: what restaurant would pay on marketplace vs DoorDash Drive cost
export function calculateSavings(subtotalCents: number, fulfillment: "DELIVERY" | "PICKUP", passTip: boolean, tipCents: number) {
  const marketplaceFee = Math.round(subtotalCents * 0.30)
  const driveCost = fulfillment === "DELIVERY" ? getDoorDashCost(passTip, tipCents) : 0
  const savings = marketplaceFee - driveCost

  return {
    marketplaceFee,
    driveCost,
    savings,
  }
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
