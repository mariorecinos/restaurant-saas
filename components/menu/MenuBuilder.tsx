"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatCents } from "@/lib/utils"

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  available: boolean
  image: string | null
}

export default function MenuBuilder({
  restaurantId,
}: {
  restaurantId: string
}) {
  const [items, setItems] = useState<MenuItem[]>([])
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
  })

  useEffect(() => {
    fetchItems()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId])

  async function fetchItems() {
    const res = await fetch(`/api/menu?restaurantId=${restaurantId}`)
    const data = await res.json()
    if (Array.isArray(data)) setItems(data)
  }

  function openNew() {
    setEditingItem(null)
    setForm({ name: "", description: "", price: "", category: "", image: "" })
    setOpen(true)
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item)
    setForm({
      name: item.name,
      description: item.description || "",
      price: (item.price / 100).toFixed(2),
      category: item.category,
      image: item.image || "",
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceInCents = Math.round(parseFloat(form.price) * 100)

    if (editingItem) {
      await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          name: form.name,
          description: form.description || null,
          price: priceInCents,
          category: form.category,
          image: form.image || null,
        }),
      })
    } else {
      await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          name: form.name,
          description: form.description || null,
          price: priceInCents,
          category: form.category,
          image: form.image || null,
        }),
      })
    }

    setOpen(false)
    fetchItems()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/menu?id=${id}`, { method: "DELETE" })
    fetchItems()
  }

  async function toggleAvailability(item: MenuItem) {
    await fetch("/api/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, available: !item.available }),
    })
    fetchItems()
  }

  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, MenuItem[]>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Menu</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Item" : "Add Menu Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="e.g. Appetizers, Entrees, Drinks"
                  required
                />
              </div>
              <div>
                <Label htmlFor="image">Image URL (optional)</Label>
                <Input
                  id="image"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingItem ? "Update" : "Add Item"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-3">{category}</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {categoryItems.map((item) => (
              <Card key={item.id} className={!item.available ? "opacity-50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <Badge variant={item.available ? "default" : "secondary"}>
                      {item.available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.description}
                    </p>
                  )}
                  <p className="font-semibold">{formatCents(item.price)}</p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAvailability(item)}
                    >
                      {item.available ? "Mark Unavailable" : "Mark Available"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No menu items yet. Click &quot;Add Item&quot; to get started.
        </p>
      )}
    </div>
  )
}
