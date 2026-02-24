import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createQuote } from "@/lib/doordash"

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.fulfillment !== "DELIVERY") {
      return NextResponse.json(
        { error: "Order is not a delivery order" },
        { status: 400 }
      )
    }

    if (!order.customerAddress) {
      return NextResponse.json(
        { error: "No delivery address provided" },
        { status: 400 }
      )
    }

    const quote = await createQuote({
      orderId: order.id,
      pickupAddress: order.restaurant.address,
      pickupBusinessName: order.restaurant.name,
      pickupPhoneNumber: order.restaurant.phone,
      dropoffAddress: order.customerAddress,
      dropoffContactName: order.customerName,
      dropoffContactPhone: order.customerPhone,
      orderValueCents: order.subtotal,
      tipCents: order.tip,
    })

    return NextResponse.json({
      quoteId: quote.external_delivery_id,
      fee: quote.fee,
      currency: quote.currency,
      deliveryTime: quote.dropoff_time_estimated,
    })
  } catch (error) {
    console.error("Error creating quote:", error)
    const message = error instanceof Error ? error.message : "Failed to create quote"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
