"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCents } from "@/lib/utils"

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image: string | null
}

export default function MenuDisplay({
  items,
  onAddToCart,
}: {
  items: MenuItem[]
  onAddToCart: (item: MenuItem) => void
}) {
  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, MenuItem[]>
  )

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category}>
          <h2 className="text-xl font-bold mb-4">{category}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {categoryItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{formatCents(item.price)}</p>
                    <Button size="sm" onClick={() => onAddToCart(item)}>
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
