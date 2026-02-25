"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [restaurantName, setRestaurantName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [existingUserId, setExistingUserId] = useState<string | null>(null)

  // Check if user is already authenticated (e.g. created via Supabase dashboard)
  useEffect(() => {
    async function checkUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setExistingUserId(user.id)
        setEmail(user.email || "")
      }
    }
    checkUser()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let userId = existingUserId

      // Only sign up if user doesn't already exist
      if (!userId) {
        const supabase = createClient()
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (authError) {
          setError(authError.message)
          return
        }

        userId = data.user?.id || null
      }

      if (userId) {
        const res = await fetch("/api/restaurants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: restaurantName,
            address,
            phone,
            ownerId: userId,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || "Failed to create restaurant profile")
          return
        }

        router.push("/dashboard")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
              RestaurantSaaS
            </Link>
          </div>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {existingUserId ? "Set Up Your Restaurant" : "Create Your Account"}
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Get your restaurant online in minutes
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input
                id="restaurantName"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Joe's Pizza"
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Restaurant Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State ZIP"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                required
              />
            </div>

            {!existingUserId && (
              <>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@restaurant.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
              </>
            )}

            {existingUserId && (
              <p className="text-sm text-muted-foreground">
                Signed in as {email}
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Setting up..."
                : existingUserId
                  ? "Create Restaurant"
                  : "Sign Up"}
            </Button>

            {!existingUserId && (
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-primary underline">
                  Sign in
                </Link>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
    </div>
  )
}
