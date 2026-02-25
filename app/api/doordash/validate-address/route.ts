import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const ValidateAddressSchema = z.object({
  customerAddress: z.string().min(5).max(500),
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed } = rateLimit(`validate-address:${ip}`, 20, 60_000)
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

    const { customerAddress } = parsed.data

    const params = new URLSearchParams({
      q: customerAddress,
      format: "json",
      limit: "1",
      addressdetails: "1",
    })

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "RestaurantSaaS/1.0 (delivery-address-validation)",
          "Accept-Language": "en",
        },
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!res.ok) {
      return NextResponse.json(
        { valid: false, error: "Address lookup service unavailable" },
        { status: 200 }
      )
    }

    const results = await res.json()

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ valid: false, error: "Address not found" })
    }

    const match = results[0]
    const addr = match.address || {}

    // Require at minimum a house number or road to be a deliverable address
    const isDeliverable = !!(addr.house_number || addr.road)

    return NextResponse.json({
      valid: isDeliverable,
      ...(isDeliverable
        ? {}
        : { error: "Address must include a street number and street name" }),
    })
  } catch (error) {
    console.error("Address validation error:", error)
    return NextResponse.json(
      { valid: false, error: "Address validation failed" },
      { status: 200 }
    )
  }
}
