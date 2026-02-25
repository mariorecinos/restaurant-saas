"use client"

import { useState, useRef } from "react"
import { Turnstile } from "@marsidev/react-turnstile"
import type { TurnstileInstance } from "@marsidev/react-turnstile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCents, calculateCustomerDeliveryFee, type DeliveryFeeConfig } from "@/lib/utils"

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

export default function Cart({
  items,
  restaurantId,
  passTip = true,
  deliveryFeeConfig,
  onUpdateQuantity,
  onRemove,
  onOrderPlaced,
}: {
  items: CartItem[]
  restaurantId: string
  passTip?: boolean
  deliveryFeeConfig: DeliveryFeeConfig
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  onRemove: (menuItemId: string) => void
  onOrderPlaced: () => void
}) {
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">(
    "DELIVERY"
  )
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [tip, setTip] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [cardName, setCardName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [addressError, setAddressError] = useState("")
  const [orderError, setOrderError] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")
  const turnstileRef = useRef<TurnstileInstance>(null)

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const tipCents = passTip ? Math.round((parseFloat(tip) || 0) * 100) : 0
  const customerDeliveryFee = calculateCustomerDeliveryFee(subtotal, fulfillment, deliveryFeeConfig)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setAddressError("")
    setOrderError("")

    try {
      // Validate delivery address via geocoding
      if (fulfillment === "DELIVERY") {
        const validateRes = await fetch("/api/doordash/validate-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerAddress }),
        })

        const validateData = await validateRes.json()
        if (!validateData.valid) {
          setAddressError(
            validateData.error ||
              "We couldn't verify your delivery address. Please check and try again."
          )
          setSubmitting(false)
          return
        }
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          customerName,
          customerPhone,
          customerAddress: fulfillment === "DELIVERY" ? customerAddress : null,
          fulfillment,
          tip: tipCents,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      })

      if (res.ok) {
        onOrderPlaced()
      } else {
        const data = await res.json().catch(() => ({}))
        setOrderError(data.error || "Something went wrong. Please try again.")
        turnstileRef.current?.reset()
        setTurnstileToken("")
      }
    } catch {
      setOrderError("Something went wrong. Please try again.")
      turnstileRef.current?.reset()
      setTurnstileToken("")
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your cart is empty.</p>
        </CardContent>
      </Card>
    )
  }

  // Build delivery fee hint text
  const feeHints: string[] = []
  if (deliveryFeeConfig.reducedFeeMin > 0) {
    feeHints.push(
      `${formatCents(deliveryFeeConfig.reducedFee)} on orders ${formatCents(deliveryFeeConfig.reducedFeeMin)}+`
    )
  }
  if (deliveryFeeConfig.freeDeliveryMin > 0) {
    feeHints.push(`Free on orders ${formatCents(deliveryFeeConfig.freeDeliveryMin)}+`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Cart</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cart Items */}
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.menuItemId} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCents(item.price)} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onUpdateQuantity(item.menuItemId, item.quantity - 1)
                    }
                  >
                    -
                  </Button>
                  <span className="text-sm w-6 text-center">
                    {item.quantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onUpdateQuantity(item.menuItemId, item.quantity + 1)
                    }
                  >
                    +
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(item.menuItemId)}
                  >
                    x
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Fulfillment Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={fulfillment === "DELIVERY" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFulfillment("DELIVERY")}
            >
              Delivery
            </Button>
            <Button
              type="button"
              variant={fulfillment === "PICKUP" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setFulfillment("PICKUP")}
            >
              Pickup
            </Button>
          </div>

          {/* Customer Info */}
          <div>
            <Label htmlFor="customerName">Name</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="customerPhone">Phone</Label>
            <Input
              id="customerPhone"
              type="tel"
              value={customerPhone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                const formatted = digits.length > 6
                  ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
                  : digits.length > 3
                    ? `(${digits.slice(0, 3)}) ${digits.slice(3)}`
                    : digits
                setCustomerPhone(formatted)
              }}
              placeholder="(555) 123-4567"
              maxLength={14}
              required
            />
          </div>
          {fulfillment === "DELIVERY" && (
            <div>
              <Label htmlFor="customerAddress">Delivery Address</Label>
              <Input
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => {
                  setCustomerAddress(e.target.value)
                  setAddressError("")
                }}
                required
              />
              {addressError && (
                <p className="text-sm text-red-600 mt-1">{addressError}</p>
              )}
            </div>
          )}

          {/* Tip */}
          {passTip && fulfillment === "DELIVERY" && (
            <div>
              <Label htmlFor="tip">Tip for Driver ($)</Label>
              <Input
                id="tip"
                type="number"
                step="0.50"
                min="0"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Payment Details */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Payment Details</p>
            <div>
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                inputMode="numeric"
                value={cardNumber}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 16)
                  const parts = digits.match(/.{1,4}/g) || []
                  setCardNumber(parts.join(" "))
                }}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cardExpiry">Expiry</Label>
                <Input
                  id="cardExpiry"
                  inputMode="numeric"
                  value={cardExpiry}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 4)
                    if (digits.length > 2) {
                      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`)
                    } else {
                      setCardExpiry(digits)
                    }
                  }}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cardCvv">CVV</Label>
                <Input
                  id="cardCvv"
                  inputMode="numeric"
                  type="password"
                  value={cardCvv}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 4)
                    setCardCvv(digits)
                  }}
                  placeholder="123"
                  maxLength={4}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Sandbox mode — no charges will be made.
            </p>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCents(subtotal)}</span>
            </div>
            {fulfillment === "DELIVERY" && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>
                    {customerDeliveryFee === 0
                      ? "Free"
                      : formatCents(customerDeliveryFee)}
                  </span>
                </div>
                {feeHints.length > 0 && customerDeliveryFee > 0 && (
                  <p className="text-xs text-green-600">
                    {feeHints.join(" · ")}
                  </p>
                )}
              </>
            )}
            {tipCents > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tip</span>
                <span>{formatCents(tipCents)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCents(subtotal + customerDeliveryFee + tipCents)}</span>
            </div>
          </div>

          {fulfillment === "DELIVERY" && (
            <div className="bg-muted p-3 rounded-lg text-xs space-y-1">
              <p className="font-semibold">Delivery Fee Policy</p>
              <p>
                Standard delivery: {formatCents(deliveryFeeConfig.deliveryFee ?? 499)}
              </p>
              {(deliveryFeeConfig.reducedFeeMin ?? 3500) > 0 && (
                <p className="text-green-600">
                  Orders over {formatCents(deliveryFeeConfig.reducedFeeMin ?? 3500)}: {formatCents(deliveryFeeConfig.reducedFee ?? 299)} delivery
                </p>
              )}
              {(deliveryFeeConfig.freeDeliveryMin ?? 10000) > 0 && (
                <p className="text-green-600 font-medium">
                  Orders over {formatCents(deliveryFeeConfig.freeDeliveryMin ?? 10000)}: Free delivery!
                </p>
              )}
            </div>
          )}

          {orderError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {orderError}
            </p>
          )}

          {TURNSTILE_SITE_KEY && (
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken("")}
              onExpire={() => setTurnstileToken("")}
              options={{ theme: "light" }}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || (!!TURNSTILE_SITE_KEY && !turnstileToken)}
          >
            {submitting ? "Placing Order..." : "Place Order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
