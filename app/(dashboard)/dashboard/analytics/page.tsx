"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCents } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Order {
  id: string
  fulfillment: "DELIVERY" | "PICKUP"
  subtotal: number
  deliveryFee: number
  marketplaceFee: number
  savings: number
  items: { name: string; quantity: number }[]
  status: string
  createdAt: string
}

interface MonthlyData {
  month: string
  savings: number
}

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const resR = await fetch(`/api/restaurants?ownerId=${user.id}`)
      const restaurant = await resR.json()
      if (!restaurant || restaurant.error) return

      const resO = await fetch(`/api/orders?restaurantId=${restaurant.id}`)
      const data = await resO.json()
      if (Array.isArray(data)) setOrders(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return <p className="text-muted-foreground">Loading analytics...</p>
  }

  const activeOrders = orders.filter((o) => o.status !== "CANCELLED")
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const thisMonthOrders = activeOrders.filter(
    (o) => new Date(o.createdAt) >= startOfMonth
  )

  const totalRevenue = thisMonthOrders.reduce((s, o) => s + o.subtotal, 0)
  const totalOrders = thisMonthOrders.length
  const deliveryOrders = thisMonthOrders.filter(
    (o) => o.fulfillment === "DELIVERY"
  ).length
  const pickupOrders = thisMonthOrders.filter(
    (o) => o.fulfillment === "PICKUP"
  ).length
  const totalFeesPaid = thisMonthOrders.reduce(
    (s, o) => s + o.deliveryFee,
    0
  )
  const totalSaved = thisMonthOrders.reduce((s, o) => s + o.savings, 0)
  const avgOrderValue =
    totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  // Top 5 items
  const itemCounts: Record<string, number> = {}
  for (const order of thisMonthOrders) {
    const items = order.items as { name: string; quantity: number }[]
    for (const item of items) {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
    }
  }
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Monthly savings chart data
  const monthlyMap: Record<string, number> = {}
  for (const order of activeOrders) {
    const d = new Date(order.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthlyMap[key] = (monthlyMap[key] || 0) + order.savings
  }
  const chartData: MonthlyData[] = Object.entries(monthlyMap)
    .sort()
    .map(([month, savings]) => ({ month, savings: savings / 100 }))

  // Busiest day
  const dayCounts: Record<string, number> = {}
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  for (const order of thisMonthOrders) {
    const day = dayNames[new Date(order.createdAt).getDay()]
    dayCounts[day] = (dayCounts[day] || 0) + 1
  }
  const busiestDay =
    Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCents(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrders}</p>
            <p className="text-sm text-muted-foreground">
              {deliveryOrders} delivery / {pickupOrders} pickup
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fees Paid (Drive)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCents(totalFeesPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saved vs Marketplace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCents(totalSaved)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Savings</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Savings"]}
                  />
                  <Bar dataKey="savings" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">
                No data yet
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Avg Order Value
                </span>
                <span className="font-semibold">
                  {formatCents(avgOrderValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Busiest Day</span>
                <span className="font-semibold">{busiestDay}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Items</CardTitle>
            </CardHeader>
            <CardContent>
              {topItems.length > 0 ? (
                <div className="space-y-2">
                  {topItems.map(([name, count], i) => (
                    <div key={name} className="flex justify-between">
                      <span>
                        {i + 1}. {name}
                      </span>
                      <span className="text-muted-foreground">
                        {count} sold
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No items sold yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
