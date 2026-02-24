import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createQuote } from "@/lib/doordash"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const { restaurantId, customerAddress, customerPhone, customerName } =
      await request.json()

    if (!restaurantId || !customerAddress || !customerPhone || !customerName) {
      return NextResponse.json(
        { valid: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

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
