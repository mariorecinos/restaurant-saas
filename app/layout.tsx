import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RestaurantSaaS — Stop Paying 30% to Delivery Platforms",
  description: "Get your own branded ordering page in minutes. Offer delivery via DoorDash Drive or pickup — and keep your profits.",
  openGraph: {
    title: "RestaurantSaaS — Stop Paying 30% to Delivery Platforms",
    description: "Own your ordering. Keep your profits. Delivery powered by DoorDash Drive at a flat fee.",
    url: "https://restaurant-saas-git-main-mariorecinos-projects.vercel.app",
    siteName: "RestaurantSaaS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RestaurantSaaS",
    description: "Own your ordering. Keep your profits.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
