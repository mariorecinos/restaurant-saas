import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDeliveryStatus } from "@/lib/doordash"
import { getAuthenticatedOwner } from "@/lib/auth"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { restaurant, error: authError } = await getAuthenticatedOwner()
    if (authError) return authError

    const { orderId } = await params

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order || order.restaurantId !== restaurant!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!order.ddDeliveryId) {
      return NextResponse.json(
        { error: "No active delivery for this order" },
        { status: 404 }
      )
    }

    const status = await getDeliveryStatus(order.ddDeliveryId)
    return NextResponse.json(status)
  } catch (error) {
    console.error("Error fetching DoorDash status:", error)
    return NextResponse.json(
      { error: "Failed to fetch delivery status" },
      { status: 500 }
    )
  }
}
