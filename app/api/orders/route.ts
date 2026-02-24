import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateCustomerDeliveryFee, calculateSavings } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      restaurantId,
      customerName,
      customerPhone,
      customerAddress,
      fulfillment,
      items,
      tip = 0,
      stripePaymentId,
    } = body

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    )

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        passTip: true,
        deliveryFee: true,
        reducedFee: true,
        reducedFeeMin: true,
        freeDeliveryMin: true,
      },
    })

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    // Customer-facing delivery fee (what customer pays)
    const customerDeliveryFee = calculateCustomerDeliveryFee(subtotal, fulfillment, {
      deliveryFee: restaurant.deliveryFee,
      reducedFee: restaurant.reducedFee,
      reducedFeeMin: restaurant.reducedFeeMin,
      freeDeliveryMin: restaurant.freeDeliveryMin,
    })

    // Restaurant savings (marketplace fee vs DoorDash Drive cost)
    const savings = calculateSavings(subtotal, fulfillment, restaurant.passTip, tip)

    const order = await prisma.order.create({
      data: {
        restaurantId,
        customerName,
        customerPhone,
        customerAddress: fulfillment === "DELIVERY" ? customerAddress : null,
        fulfillment,
        items,
        subtotal,
        deliveryFee: customerDeliveryFee,
        marketplaceFee: savings.marketplaceFee,
        savings: savings.savings,
        tip,
        stripePaymentId,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId is required" },
        { status: 400 }
      )
    }

    const status = searchParams.get("status")

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
