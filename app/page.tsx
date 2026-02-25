import Link from "next/link"
import SavingsCalculator from "@/components/landing/SavingsCalculator"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <span className="text-xl font-bold">RestaurantSaaS</span>
          <div className="flex gap-4">
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            Stop Paying 30% to Delivery Platforms
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get your own branded ordering page in minutes. Offer delivery via
            DoorDash Drive or pickup — and keep your profits.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/sign-up"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-md text-lg font-medium hover:bg-primary/90"
            >
              Start Free — No Contract Required
            </Link>
            <a
              href="#calculator"
              className="border px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-50"
            >
              See Savings
            </a>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl font-semibold text-green-600">
            Restaurants save an average of $2,400/month
          </p>
          <p className="text-muted-foreground mt-2">
            by switching from marketplace platforms to their own ordering page
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold">Sign Up</h3>
              <p className="text-muted-foreground">
                Create your account and fill in your restaurant details. Takes
                less than 2 minutes.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold">Build Your Menu</h3>
              <p className="text-muted-foreground">
                Add your menu items with prices and categories. Your branded
                ordering page goes live instantly.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold">Start Taking Orders</h3>
              <p className="text-muted-foreground">
                Customers order delivery or pickup from your page. You save on
                every single order.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Your Own Ordering Page",
                desc: "Branded page for your restaurant at yourapp.com/order/your-restaurant",
              },
              {
                title: "DoorDash Delivery",
                desc: "Professional delivery via DoorDash Drive at a flat fee — no marketplace markups",
              },
              {
                title: "Pickup Orders",
                desc: "Accept pickup orders at $0 delivery cost — keep nearly everything",
              },
              {
                title: "Live Dashboard",
                desc: "Real-time order feed with one-click confirm and status tracking",
              },
              {
                title: "Savings Tracker",
                desc: "See exactly how much you save vs marketplace fees on every order",
              },
              {
                title: "Monthly Reports",
                desc: "Revenue analytics, top items, savings trends — all in one place",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="border rounded-lg p-6 space-y-2"
              >
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-8 bg-white space-y-4">
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="text-3xl font-bold">
                $0<span className="text-lg font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-muted-foreground">Up to 50 orders/month</p>
              <ul className="space-y-2 text-sm">
                <li>Branded ordering page</li>
                <li>Delivery + pickup</li>
                <li>Basic dashboard</li>
              </ul>
            </div>
            <div className="border-2 border-primary rounded-lg p-8 bg-white space-y-4 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                Most Popular
              </span>
              <h3 className="text-xl font-semibold">Growth</h3>
              <p className="text-3xl font-bold">
                $79<span className="text-lg font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-muted-foreground">Unlimited orders</p>
              <ul className="space-y-2 text-sm">
                <li>Everything in Free</li>
                <li>Analytics dashboard</li>
                <li>Priority support</li>
              </ul>
            </div>
            <div className="border rounded-lg p-8 bg-white space-y-4">
              <h3 className="text-xl font-semibold">Pro</h3>
              <p className="text-3xl font-bold">
                $149<span className="text-lg font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-muted-foreground">Unlimited everything</p>
              <ul className="space-y-2 text-sm">
                <li>Everything in Growth</li>
                <li>Custom domain</li>
                <li>API access</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <div className="space-y-6">
            {[
              {
                q: "How does delivery work?",
                a: "We use DoorDash Drive to dispatch professional drivers. You pay a flat delivery fee (~$9.75) instead of 30% marketplace commissions.",
              },
              {
                q: "What about pickup orders?",
                a: "Pickup orders cost you $0 in delivery fees. You only pay standard Stripe processing (~2.9%).",
              },
              {
                q: "How much will I save?",
                a: "Most restaurants save $1,500-$3,000/month depending on order volume. Use our calculator above to get your estimate.",
              },
              {
                q: "Do I need my own website?",
                a: "No! We give you a branded ordering page at yourapp.com/order/your-restaurant. Just share the link with your customers.",
              },
              {
                q: "Is there a contract?",
                a: "No contracts. Cancel anytime. Start free with up to 50 orders/month.",
              },
            ].map((faq) => (
              <div key={faq.q} className="border-b pb-4">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Calculator */}
      <section id="calculator" className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold">See How Much You Could Save</h2>
          <div className="flex justify-center">
            <SavingsCalculator />
          </div>
          <div className="pt-6">
            <Link
              href="/sign-up"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-md text-lg font-medium hover:bg-primary/90"
            >
              Start Free — No Contract Required
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-white border-t">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} RestaurantSaaS. All rights
          reserved.
        </div>
      </footer>
    </div>
  )
}
