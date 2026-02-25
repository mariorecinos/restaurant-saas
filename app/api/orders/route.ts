import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { calculateCustomerDeliveryFee, calculateSavings } from "@/lib/utils"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/turnstile"

const CreateOrderSchema = z.object({
  restaurantId: z.string().min(1),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(7).max(20),
  customerAddress: z.string().max(500).optional(),
  fulfillment: z.enum(["DELIVERY", "PICKUP"]),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().int().positive(),
        quantity: z.number().int().positive().max(100),
      })
    )
    .min(1)
    .max(50),
  tip: z.number().int().min(0).max(100000).optional().default(0),
  stripePaymentId: z.string().optional(),
  turnstileToken: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed } = rateLimit(`orders:${ip}`, 20, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  try {
    const rawBody = await request.json()
    const parsed = CreateOrderSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      restaurantId,
      customerName,
      customerPhone,
      customerAddress,
      fulfillment,
      items,
      tip,
      stripePaymentId,
      turnstileToken,
    } = parsed.data

    if (process.env.TURNSTILE_SECRET_KEY) {
      const valid = await verifyTurnstile(turnstileToken ?? "", getClientIp(request))
      if (!valid) {
        return NextResponse.json(
          { error: "Bot verification failed. Please try again." },
          { status: 403 }
        )
      }
    }

    if (fulfillment === "DELIVERY" && !customerAddress) {
      return NextResponse.json(
        { error: "Delivery address is required for delivery orders" },
        { status: 400 }
      )
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
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

    const customerDeliveryFee = calculateCustomerDeliveryFee(subtotal, fulfillment, {
      deliveryFee: restaurant.deliveryFee,
      reducedFee: restaurant.reducedFee,
      reducedFeeMin: restaurant.reducedFeeMin,
      freeDeliveryMin: restaurant.freeDeliveryMin,
    })

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
