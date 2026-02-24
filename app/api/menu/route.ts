import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedOwner } from "@/lib/auth"

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

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: { category: "asc" },
    })

    return NextResponse.json(menuItems)
  } catch (error) {
    console.error("Error fetching menu:", error)
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { restaurant, error: authError } = await getAuthenticatedOwner()
    if (authError) return authError

    const body = await request.json()
    const { name, description, price, category, image } = body

    const menuItem = await prisma.menuItem.create({
      data: {
        restaurantId: restaurant!.id,
        name,
        description,
        price,
        category,
        image,
      },
    })

    return NextResponse.json(menuItem, { status: 201 })
  } catch (error) {
    console.error("Error creating menu item:", error)
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { restaurant, error: authError } = await getAuthenticatedOwner()
    if (authError) return authError

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: "Menu item id is required" },
        { status: 400 }
      )
    }

    const item = await prisma.menuItem.findUnique({ where: { id } })
    if (!item || item.restaurantId !== restaurant!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data,
    })

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error("Error updating menu item:", error)
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { restaurant, error: authError } = await getAuthenticatedOwner()
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Menu item id is required" },
        { status: 400 }
      )
    }

    const item = await prisma.menuItem.findUnique({ where: { id } })
    if (!item || item.restaurantId !== restaurant!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.menuItem.delete({ where: { id } })

    return NextResponse.json({ message: "Menu item deleted" })
  } catch (error) {
    console.error("Error deleting menu item:", error)
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    )
  }
}
