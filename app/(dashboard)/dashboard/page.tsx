import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import SavingsCounter from "@/components/dashboard/SavingsCounter"
import OrderFeed from "@/components/dashboard/OrderFeed"

export default async function DashboardPage() {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {restaurant.name}
        </p>
      </div>
      <SavingsCounter restaurantId={restaurant.id} />
      <div>
        <h2 className="text-2xl font-bold mb-4">Orders</h2>
        <OrderFeed restaurantId={restaurant.id} />
      </div>
    </div>
  )
}
