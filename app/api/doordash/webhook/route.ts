import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const EVENT_STATUS_MAP: Record<string, string> = {
  dasher_confirmed: "DRIVER_ASSIGNED",
  dasher_enroute_to_pickup: "ENROUTE_TO_PICKUP",
  dasher_confirmed_pickup_arrival: "ARRIVED_AT_PICKUP",
  dasher_picked_up: "PICKED_UP",
  dasher_enroute_to_dropoff: "ENROUTE_TO_DROPOFF",
  dasher_confirmed_dropoff_arrival: "ARRIVED_AT_DROPOFF",
  dasher_dropped_off: "DELIVERED",
  delivered: "DELIVERED",
  delivery_cancelled: "CANCELLED",
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_name, external_delivery_id, tracking_url } = body

    console.log("[DoorDash Webhook]", event_name, external_delivery_id)

    const newStatus = EVENT_STATUS_MAP[event_name]
    if (!newStatus) {
      console.log("[DoorDash Webhook] Unhandled event:", event_name)
      return NextResponse.json({ message: "Event acknowledged" }, { status: 200 })
    }

    const order = await prisma.order.findFirst({
      where: { ddDeliveryId: external_delivery_id },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus as never,
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
