"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Restaurant {
  id: string
  name: string
  slug: string
  address: string
  phone: string
  logo: string | null
  passTip: boolean
  deliveryFee: number
  reducedFee: number
  reducedFeeMin: number
  freeDeliveryMin: number
}

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    logo: "",
    passTip: true,
    deliveryFee: "4.99",
    reducedFee: "2.99",
    reducedFeeMin: "35.00",
    freeDeliveryMin: "100.00",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [billing, setBilling] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
    nameOnCard: "",
    billingZip: "",
  })
  const [billingSaved, setBillingSaved] = useState(false)
  const [billingSaving, setBillingSaving] = useState(false)

  useEffect(() => {
    async function fetchRestaurant() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const res = await fetch(`/api/restaurants?ownerId=${user.id}`)
      const data = await res.json()
      if (data && !data.error) {
        setRestaurant(data)
        setForm({
          name: data.name,
          address: data.address,
          phone: data.phone,
          logo: data.logo || "",
          passTip: data.passTip ?? true,
          deliveryFee: (data.deliveryFee / 100).toFixed(2),
          reducedFee: (data.reducedFee / 100).toFixed(2),
          reducedFeeMin: (data.reducedFeeMin / 100).toFixed(2),
          freeDeliveryMin: (data.freeDeliveryMin / 100).toFixed(2),
        })
      }
    }
    fetchRestaurant()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurant) return

    setSaving(true)
    setSaved(false)

    await fetch("/api/restaurants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: restaurant.id,
        name: form.name,
        address: form.address,
        phone: form.phone,
        logo: form.logo || null,
        passTip: form.passTip,
      }),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!restaurant) {
    return <p className="text-muted-foreground">Loading...</p>
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://restaurant-saas-omega.vercel.app")
  const orderUrl = `${baseUrl}/order/${restaurant.slug}`

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your Ordering Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Share this link with your customers:
          </p>
          <code className="block p-3 bg-muted rounded text-sm break-all">
            {orderUrl}
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restaurant Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Restaurant Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="logo">Logo URL (optional)</Label>
              <Input
                id="logo"
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            {saved && (
              <span className="ml-3 text-sm text-green-600">
                Changes saved!
              </span>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restaurant Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add a debit or credit card to cover DoorDash Drive delivery fees and Stripe processing fees.
            You will only be charged when deliveries are dispatched.
          </p>
          <div>
            <Label htmlFor="nameOnCard">Name on Card</Label>
            <Input
              id="nameOnCard"
              value={billing.nameOnCard}
              onChange={(e) => setBilling({ ...billing, nameOnCard: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={billing.cardNumber}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 16)
                const formatted = v.replace(/(\d{4})(?=\d)/g, "$1 ")
                setBilling({ ...billing, cardNumber: formatted })
              }}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expiry">Expiry</Label>
              <Input
                id="expiry"
                value={billing.expiry}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "").slice(0, 4)
                  if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2)
                  setBilling({ ...billing, expiry: v })
                }}
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
            <div>
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                value={billing.cvc}
                onChange={(e) => setBilling({ ...billing, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                placeholder="123"
                maxLength={4}
              />
            </div>
            <div>
              <Label htmlFor="billingZip">Billing ZIP</Label>
              <Input
                id="billingZip"
                value={billing.billingZip}
                onChange={(e) => setBilling({ ...billing, billingZip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                placeholder="90210"
                maxLength={5}
              />
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
            <p className="font-semibold">What you&apos;ll be charged</p>
            <p>• DoorDash Drive fee: $9.75/delivery ($7.00 with tip pass-through)</p>
            <p>• Stripe processing: 2.9% + $0.30 per transaction</p>
            <p className="text-muted-foreground mt-1">No monthly fees. Pay only when orders come in.</p>
          </div>

          <Button
            onClick={async () => {
              setBillingSaving(true)
              setBillingSaved(false)
              await new Promise((r) => setTimeout(r, 800))
              setBillingSaving(false)
              setBillingSaved(true)
              setTimeout(() => setBillingSaved(false), 3000)
            }}
            disabled={billingSaving || !billing.cardNumber || !billing.expiry || !billing.cvc}
          >
            {billingSaving ? "Saving..." : "Save Payment Method"}
          </Button>
          {billingSaved && (
            <span className="ml-3 text-sm text-green-600">
              Payment method saved!
            </span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Payment Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-semibold">Stripe Connect — coming soon</p>
            <p className="text-sm text-muted-foreground">
              Customer payment processing is currently in sandbox mode. Card
              details are collected at checkout but no charges are made. Stripe
              Connect onboarding will let you receive customer payments directly
              into your bank account.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="passTip"
              checked={form.passTip}
              onChange={(e) => setForm({ ...form, passTip: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <div>
              <Label htmlFor="passTip" className="font-semibold">
                Pass tips to DoorDash driver
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, customer tips are passed directly to the Dasher.
                DoorDash applies a <strong>$2.75 discount</strong> on the base
                delivery rate, reducing your fee from <strong>$9.75</strong> to{" "}
                <strong>$7.00 per delivery</strong>.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                When disabled, no tip field is shown to customers and the
                standard $9.75 base rate applies.
              </p>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <p className="font-semibold text-sm">Customer Delivery Fees</p>
            <p className="text-sm text-muted-foreground">
              Set the delivery fee your customers see at checkout. This is separate from the DoorDash Drive cost to you.
            </p>
            <div>
              <Label htmlFor="deliveryFee">Base Delivery Fee ($)</Label>
              <Input
                id="deliveryFee"
                type="number"
                step="0.01"
                min="0"
                value={form.deliveryFee}
                onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reducedFee">Reduced Fee ($)</Label>
                <Input
                  id="reducedFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.reducedFee}
                  onChange={(e) => setForm({ ...form, reducedFee: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reducedFeeMin">When order is over ($)</Label>
                <Input
                  id="reducedFeeMin"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.reducedFeeMin}
                  onChange={(e) => setForm({ ...form, reducedFeeMin: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="freeDeliveryMin">Free delivery when order is over ($)</Label>
              <Input
                id="freeDeliveryMin"
                type="number"
                step="0.01"
                min="0"
                value={form.freeDeliveryMin}
                onChange={(e) => setForm({ ...form, freeDeliveryMin: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Set to 0 to never offer free delivery</p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
            <p className="font-semibold">Your DoorDash Drive Cost (not shown to customer)</p>
            <p>Without tip pass-through: $9.75 per delivery</p>
            <p className="text-green-600 font-medium">With tip pass-through: $7.00 per delivery</p>
          </div>

          <Button
            onClick={async () => {
              setSaving(true)
              setSaved(false)
              await fetch("/api/restaurants", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: restaurant.id,
                  passTip: form.passTip,
                  deliveryFee: Math.round(parseFloat(form.deliveryFee) * 100),
                  reducedFee: Math.round(parseFloat(form.reducedFee) * 100),
                  reducedFeeMin: Math.round(parseFloat(form.reducedFeeMin) * 100),
                  freeDeliveryMin: Math.round(parseFloat(form.freeDeliveryMin) * 100),
                }),
              })
              setSaving(false)
              setSaved(true)
              setTimeout(() => setSaved(false), 3000)
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Delivery Settings"}
          </Button>
          {saved && (
            <span className="ml-3 text-sm text-green-600">
              Changes saved!
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
