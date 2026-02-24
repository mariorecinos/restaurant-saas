"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import OrderCard from "./OrderCard"

interface OrderItem {
  name: string
  price: number
  quantity: number
}

interface Order {
  id: string
  customerName: string
  customerPhone: string
  customerAddress: string | null
  fulfillment: "DELIVERY" | "PICKUP"
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  savings: number
  status: string
  ddTrackingUrl: string | null
  createdAt: string
}

export default function OrderFeed({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [orderErrors, setOrderErrors] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?restaurantId=${restaurantId}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setOrders(data)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchOrders()

    const supabase = createClient()
    const channel = supabase
      .channel("orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Order",
          filter: `restaurantId=eq.${restaurantId}`,
        },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, fetchOrders])

  async function handleConfirm(orderId: string) {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    setActionLoading((prev) => ({ ...prev, [orderId]: true }))
    setOrderErrors((prev) => ({ ...prev, [orderId]: "" }))

    try {
      if (order.fulfillment === "DELIVERY") {
        const res = await fetch("/api/doordash/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        })
        if (!res.ok) {
          const data = await res.json()
          setOrderErrors((prev) => ({
            ...prev,
            [orderId]: data.error || "Failed to dispatch delivery. Please check the address and phone number and try again.",
          }))
          return
        }
      } else {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CONFIRMED" }),
        })
        if (!res.ok) {
          setOrderErrors((prev) => ({
            ...prev,
            [orderId]: "Failed to confirm order.",
          }))
          return
        }
      }
      fetchOrders()
    } catch {
      setOrderErrors((prev) => ({
        ...prev,
        [orderId]: "An unexpected error occurred. Please try again.",
      }))
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  async function handleCancel(orderId: string) {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }))
    setOrderErrors((prev) => ({ ...prev, [orderId]: "" }))

    try {
      const res = await fetch("/api/doordash/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setOrderErrors((prev) => ({
          ...prev,
          [orderId]: data.error || "Failed to cancel order.",
        }))
        return
      }
      fetchOrders()
    } catch {
      setOrderErrors((prev) => ({
        ...prev,
        [orderId]: "An unexpected error occurred. Please try again.",
      }))
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading orders...</p>
  }

  if (orders.length === 0) {
    return <p className="text-muted-foreground">No orders yet.</p>
  }

  const pending = orders.filter((o) => o.status === "PENDING")
  const active = orders.filter((o) =>
    [
      "CONFIRMED",
      "DRIVER_ASSIGNED",
      "ENROUTE_TO_PICKUP",
      "ARRIVED_AT_PICKUP",
      "PICKED_UP",
      "ENROUTE_TO_DROPOFF",
      "ARRIVED_AT_DROPOFF",
    ].includes(o.status)
  )
  const completed = orders.filter((o) =>
    ["DELIVERED", "CANCELLED"].includes(o.status)
  )

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Pending ({pending.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pending.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                error={orderErrors[order.id]}
                loading={actionLoading[order.id]}
              />
            ))}
          </div>
        </div>
      )}
      {active.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            In Progress ({active.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {active.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                error={orderErrors[order.id]}
                loading={actionLoading[order.id]}
              />
            ))}
          </div>
        </div>
      )}
      {completed.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Completed ({completed.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completed.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                error={orderErrors[order.id]}
                loading={actionLoading[order.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
