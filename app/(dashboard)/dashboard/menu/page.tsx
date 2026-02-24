import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import MenuBuilder from "@/components/menu/MenuBuilder"

export default async function MenuPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: user.id },
  })

  if (!restaurant) redirect("/sign-up")

  return (
    <div>
      <MenuBuilder restaurantId={restaurant.id} />
    </div>
  )
}
