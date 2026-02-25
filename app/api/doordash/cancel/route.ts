import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cancelDelivery } from "@/lib/doordash"
import { getAuthenticatedOwner } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { restaurant, error: authError } = await getAuthenticatedOwner()
    if (authError) return authError

    const { orderId } = await request.json()

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.restaurantId !== restaurant!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (["DELIVERED", "CANCELLED"].includes(order.status)) {
      return NextResponse.json(
        { error: `Order cannot be cancelled — it is already ${order.status.toLowerCase()}` },
        { status: 409 }
      )
    }

    // If there's an active DoorDash delivery, cancel it
    if (order.ddDeliveryId) {
      try {
        await cancelDelivery(order.ddDeliveryId)
      } catch (error) {
        console.error("DoorDash cancel error:", error)
        // Still update our DB even if DD cancel fails (delivery may already be cancelled)
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error cancelling order:", error)
    const message = error instanceof Error ? error.message : "Failed to cancel order"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
