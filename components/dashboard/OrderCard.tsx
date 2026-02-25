"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCents } from "@/lib/utils"

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
  marketplaceFee: number
  savings: number
  status: string
  ddTrackingUrl: string | null
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500",
  CONFIRMED: "bg-blue-500",
  DRIVER_ASSIGNED: "bg-purple-500",
  ENROUTE_TO_PICKUP: "bg-purple-400",
  ARRIVED_AT_PICKUP: "bg-purple-600",
  PICKED_UP: "bg-indigo-500",
  ENROUTE_TO_DROPOFF: "bg-indigo-400",
  ARRIVED_AT_DROPOFF: "bg-indigo-600",
  DELIVERED: "bg-green-500",
  CANCELLED: "bg-red-500",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  DRIVER_ASSIGNED: "Driver Assigned",
  ENROUTE_TO_PICKUP: "Driver En Route",
  ARRIVED_AT_PICKUP: "Driver at Restaurant",
  PICKED_UP: "Picked Up",
  ENROUTE_TO_DROPOFF: "Out for Delivery",
  ARRIVED_AT_DROPOFF: "Driver Arriving",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
}

const CANCELLABLE_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "DRIVER_ASSIGNED",
  "ENROUTE_TO_PICKUP",
  "ARRIVED_AT_PICKUP",
]

export default function OrderCard({
  order,
  onConfirm,
  onCancel,
  error,
  loading,
}: {
  order: Order
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
  error?: string | null
  loading?: boolean
}) {
  const items = order.items as OrderItem[]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {order.customerName}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {order.fulfillment === "DELIVERY" ? "Delivery" : "Pickup"}
            </span>
          </CardTitle>
          <Badge className={STATUS_COLORS[order.status] || "bg-gray-500"}>
            {STATUS_LABELS[order.status] || order.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>{formatCents(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-2 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCents(order.subtotal)}</span>
          </div>
          {order.fulfillment === "DELIVERY" && (
            <div className="flex justify-between text-sm">
              <span>DoorDash Drive Cost</span>
              <span>{formatCents(order.marketplaceFee - order.savings)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold text-green-600">
            <span>You saved</span>
            <span>{formatCents(order.savings)}</span>
          </div>
        </div>

        {order.ddTrackingUrl && (
          <a
            href={order.ddTrackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline"
          >
            Track Delivery
          </a>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}

        <div className="flex gap-2 pt-2">
          {order.status === "PENDING" && (
            <Button
              onClick={() => onConfirm(order.id)}
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm"}
            </Button>
          )}
          {CANCELLABLE_STATUSES.includes(order.status) && (
            <Button
              variant="destructive"
              onClick={() => onCancel(order.id)}
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Cancelling..." : "Cancel"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
