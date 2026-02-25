"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import MenuDisplay from "@/components/ordering/MenuDisplay"
import Cart, { type CartItem } from "@/components/ordering/Cart"

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image: string | null
}

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
  menuItems: MenuItem[]
}

export default function OrderPage() {
  const params = useParams()
  const slug = params.slug as string
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRestaurant() {
      const res = await fetch(`/api/restaurants?slug=${slug}`)
      const data = await res.json()
      if (data && !data.error) {
        setRestaurant(data)
      }
      setLoading(false)
    }
    fetchRestaurant()
  }, [slug])

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id)
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ]
    })
  }, [])

  function updateQuantity(menuItemId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId))
    } else {
      setCart((prev) =>
        prev.map((c) =>
          c.menuItemId === menuItemId ? { ...c, quantity } : c
        )
      )
    }
  }

  function removeItem(menuItemId: string) {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Restaurant not found</p>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Order Placed!</h1>
          <p className="text-muted-foreground">
            Thank you for your order from {restaurant.name}. You&apos;ll receive
            updates on your order status.
          </p>
          <button
            onClick={() => {
              setOrderPlaced(false)
              setCart([])
            }}
            className="text-primary underline"
          >
            Place another order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
          {restaurant.logo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="w-16 h-16 rounded-full object-cover border"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
            <p className="text-muted-foreground">{restaurant.address}</p>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MenuDisplay
              items={restaurant.menuItems}
              onAddToCart={addToCart}
            />
          </div>
          <div>
            <div className="sticky top-8">
              <Cart
                items={cart}
                restaurantId={restaurant.id}
                passTip={restaurant.passTip}
                deliveryFeeConfig={{
                  deliveryFee: restaurant.deliveryFee,
                  reducedFee: restaurant.reducedFee,
                  reducedFeeMin: restaurant.reducedFeeMin,
                  freeDeliveryMin: restaurant.freeDeliveryMin,
                }}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
                onOrderPlaced={() => setOrderPlaced(true)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
