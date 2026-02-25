import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"

const EVENT_STATUS_MAP: Record<string, OrderStatus> = {
  dasher_confirmed: OrderStatus.DRIVER_ASSIGNED,
  dasher_enroute_to_pickup: OrderStatus.ENROUTE_TO_PICKUP,
  dasher_confirmed_pickup_arrival: OrderStatus.ARRIVED_AT_PICKUP,
  dasher_picked_up: OrderStatus.PICKED_UP,
  dasher_enroute_to_dropoff: OrderStatus.ENROUTE_TO_DROPOFF,
  dasher_confirmed_dropoff_arrival: OrderStatus.ARRIVED_AT_DROPOFF,
  dasher_dropped_off: OrderStatus.DELIVERED,
  delivered: OrderStatus.DELIVERED,
  delivery_cancelled: OrderStatus.CANCELLED,
}

export async function POST(request: NextRequest) {
  try {
    // Validate DoorDash Basic auth header if configured
    const webhookSecret = process.env.DOORDASH_WEBHOOK_SECRET
    if (webhookSecret) {
      const incoming = request.headers.get("authorization")
      if (incoming !== webhookSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const body = await request.json()
    const { event_name, external_delivery_id, tracking_url } = body

    if (process.env.NODE_ENV !== "production") {
      console.log("[DoorDash Webhook]", event_name, external_delivery_id)
    }

    const newStatus = EVENT_STATUS_MAP[event_name]
    if (!newStatus) {
      console.log("[DoorDash Webhook] Unhandled event:", event_name)
      return NextResponse.json({ message: "Event acknowledged" }, { status: 200 })
    }

    const order = await prisma.order.findFirst({
      where: { ddDeliveryId: external_delivery_id },
    })

    if (!order) {
      // Return 200 so DoorDash doesn't retry — this can happen for validation quotes
      return NextResponse.json({ message: "Order not found, acknowledged" }, { status: 200 })
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        ...(tracking_url ? { ddTrackingUrl: tracking_url } : {}),
      },
    })

    return NextResponse.json({ message: "Status updated" }, { status: 200 })
  } catch (error) {
    console.error("DoorDash webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
