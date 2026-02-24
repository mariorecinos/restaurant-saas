import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold">
                RestaurantSaaS
              </Link>
              <div className="hidden md:flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Orders
                </Link>
                <Link
                  href="/dashboard/menu"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Menu
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Analytics
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Settings
                </Link>
              </div>
            </div>
            <form
              action={async () => {
                "use server"
                const supabase = await createClient()
                await supabase.auth.signOut()
                redirect("/sign-in")
              }}
            >
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
