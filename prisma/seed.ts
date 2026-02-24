import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "marios-pizzeria" },
    update: {},
    create: {
      name: "Mario's Pizzeria",
      slug: "marios-pizzeria",
      address: "901 Market St, San Francisco, CA 94103",
      phone: "+14155551234",
      ownerId: "demo-owner-id",
      passTip: true,
      deliveryFee: 499,
      reducedFee: 299,
      reducedFeeMin: 3500,
      freeDeliveryMin: 10000,
    },
  })

  const items = [
    { name: "Margherita Pizza", description: "Fresh mozzarella, basil, San Marzano tomatoes", price: 1499, category: "Pizza" },
    { name: "Pepperoni Pizza", description: "Classic pepperoni with mozzarella", price: 1699, category: "Pizza" },
    { name: "Caesar Salad", description: "Romaine, parmesan, croutons, house dressing", price: 999, category: "Salads" },
    { name: "Garlic Bread", description: "Toasted with garlic butter and herbs", price: 599, category: "Sides" },
    { name: "Tiramisu", description: "Classic Italian dessert", price: 899, category: "Desserts" },
    { name: "Lemonade", description: "Fresh-squeezed lemonade", price: 399, category: "Drinks" },
  ]

  for (const item of items) {
    await prisma.menuItem.upsert({
      where: { id: `seed-${item.name.toLowerCase().replace(/\s/g, "-")}` },
      update: {},
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
