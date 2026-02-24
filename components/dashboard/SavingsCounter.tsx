"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCents } from "@/lib/utils"

interface Stats {
  savedThisMonth: number
  savedAllTime: number
  ordersToday: number
  ordersThisMonth: number
}

export default function SavingsCounter({
  restaurantId,
}: {
  restaurantId: string
}) {
  const [stats, setStats] = useState<Stats>({
    savedThisMonth: 0,
    savedAllTime: 0,
    ordersToday: 0,
    ordersThisMonth: 0,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/orders?restaurantId=${restaurantId}`)
        const orders = await res.json()

        if (!Array.isArray(orders)) return

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        )

        let savedThisMonth = 0
        let savedAllTime = 0
        let ordersToday = 0
        let ordersThisMonth = 0

        for (const order of orders) {
          if (order.status === "CANCELLED") continue
          savedAllTime += order.savings
          const createdAt = new Date(order.createdAt)
          if (createdAt >= startOfMonth) {
            savedThisMonth += order.savings
            ordersThisMonth++
          }
          if (createdAt >= startOfDay) {
            ordersToday++
          }
        }

        setStats({ savedThisMonth, savedAllTime, ordersToday, ordersThisMonth })
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    fetchStats()
  }, [restaurantId])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saved This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            {formatCents(stats.savedThisMonth)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saved Since Joining
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            {formatCents(stats.savedAllTime)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Orders Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.ordersToday}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Orders This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.ordersThisMonth}</p>
        </CardContent>
      </Card>
    </div>
  )
}
