import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")
    const ownerId = searchParams.get("ownerId")

    if (slug) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { slug },
        include: { menuItems: { where: { available: true } } },
      })
      if (!restaurant) {
        return NextResponse.json(
          { error: "Restaurant not found" },
          { status: 404 }
        )
      }
      return NextResponse.json(restaurant)
    }

    if (ownerId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId },
      })
      if (!restaurant) {
        return NextResponse.json(
          { error: "Restaurant not found" },
          { status: 404 }
        )
      }
      return NextResponse.json(restaurant)
    }

    return NextResponse.json(
      { error: "slug or ownerId parameter required" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error fetching restaurant:", error)
    return NextResponse.json(
      { error: "Failed to fetch restaurant" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, phone, ownerId, logo } = body

    let slug = slugify(name)

    // Ensure unique slug
    const existing = await prisma.restaurant.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    const restaurant = await prisma.restaurant.create({
      data: { name, slug, address, phone, ownerId, logo },
    })

    return NextResponse.json(restaurant, { status: 201 })
  } catch (error) {
    console.error("Error creating restaurant:", error)
    return NextResponse.json(
      { error: "Failed to create restaurant" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: "Restaurant id is required" },
        { status: 400 }
      )
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data,
    })

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error("Error updating restaurant:", error)
    return NextResponse.json(
      { error: "Failed to update restaurant" },
      { status: 500 }
    )
  }
}
