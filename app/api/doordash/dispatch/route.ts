import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createQuote, acceptQuote } from "@/lib/doordash"
import { getAuthenticatedOwner } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { restaurant, error: authError } = await getAuthenticatedOwner()
    if (authError) return authError

    const { orderId } = await request.json()

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.restaurantId !== restaurant!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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

    // Step 1: Create quote
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

    // Step 2: Accept quote to create delivery
    const delivery = await acceptQuote(quote.external_delivery_id)

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        ddDeliveryId: delivery.external_delivery_id,
        ddTrackingUrl: delivery.tracking_url,
      },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error dispatching delivery:", error)
    const message = error instanceof Error ? error.message : "Failed to dispatch delivery"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
