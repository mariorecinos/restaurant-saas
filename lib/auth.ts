import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function getAuthenticatedOwner() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, restaurant: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: user.id },
  })

  if (!restaurant) {
    return { user, restaurant: null, error: NextResponse.json({ error: "Restaurant not found" }, { status: 404 }) }
  }

  return { user, restaurant, error: null }
}
