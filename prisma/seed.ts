import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const restaurant = await prisma.restaurant.upsert({
    where: { ownerId: "beb66439-f929-49b9-9241-4da490408856" },
    update: {
      name: "Mario's Pizzeria",
      slug: "marios-pizzeria",
      address: "901 Market St, San Francisco, CA 94103",
      phone: "+14155551234",
      logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop",
    },
    create: {
      name: "Mario's Pizzeria",
      slug: "marios-pizzeria",
      address: "901 Market St, San Francisco, CA 94103",
      phone: "+14155551234",
      ownerId: "beb66439-f929-49b9-9241-4da490408856",
      passTip: true,
      deliveryFee: 499,
      reducedFee: 299,
      reducedFeeMin: 3500,
      freeDeliveryMin: 10000,
    },
  })

  const items = [
    { name: "Margherita Pizza", description: "Fresh mozzarella, basil, San Marzano tomatoes", price: 1499, category: "Pizza", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop" },
    { name: "Pepperoni Pizza", description: "Classic pepperoni with mozzarella", price: 1699, category: "Pizza", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop" },
    { name: "Caesar Salad", description: "Romaine, parmesan, croutons, house dressing", price: 999, category: "Salads", image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop" },
    { name: "Garlic Bread", description: "Toasted with garlic butter and herbs", price: 599, category: "Sides", image: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&h=300&fit=crop" },
    { name: "Tiramisu", description: "Classic Italian dessert", price: 899, category: "Desserts", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop" },
    { name: "Lemonade", description: "Fresh-squeezed lemonade", price: 399, category: "Drinks", image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop" },
  ]

  for (const item of items) {
    await prisma.menuItem.upsert({
      where: { id: `seed-${item.name.toLowerCase().replace(/\s/g, "-")}` },
      update: { image: item.image },
      create: {
        id: `seed-${item.name.toLowerCase().replace(/\s/g, "-")}`,
        restaurantId: restaurant.id,
        ...item,
      },
    })
  }

  console.log(`Seeded restaurant: ${restaurant.name} (slug: ${restaurant.slug})`)
  console.log(`Seeded ${items.length} menu items`)
  console.log(`\nView ordering page: /order/marios-pizzeria`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
