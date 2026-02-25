import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createQuote } from "@/lib/doordash"
import { v4 as uuidv4 } from "uuid"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const ValidateAddressSchema = z.object({
  restaurantId: z.string().min(1),
  customerAddress: z.string().min(5).max(500),
  customerPhone: z.string().min(7).max(20),
  customerName: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed } = rateLimit(`validate-address:${ip}`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { valid: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  try {
    const rawBody = await request.json()
    const parsed = ValidateAddressSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { restaurantId, customerAddress, customerPhone, customerName } = parsed.data

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })

    if (!restaurant) {
      return NextResponse.json(
        { valid: false, error: "Restaurant not found" },
        { status: 404 }
      )
    }

    const tempId = `addr-validate-${uuidv4()}`

    await createQuote({
      orderId: tempId,
      pickupAddress: restaurant.address,
      pickupBusinessName: restaurant.name,
      pickupPhoneNumber: restaurant.phone,
      dropoffAddress: customerAddress,
      dropoffContactName: customerName,
      dropoffContactPhone: customerPhone,
      orderValueCents: 1000,
      tipCents: 0,
    })

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Address validation error:", error)
    const message =
      error instanceof Error ? error.message : "Address validation failed"
    return NextResponse.json({ valid: false, error: message }, { status: 200 })
  }
}
