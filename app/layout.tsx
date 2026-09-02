import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { Inter } from "next/font/google"
import { Sora } from "next/font/google"
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

// --- Redesign type pair (public site). Inter/Sora stay for /admin. ---
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
})

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora",
  weight: ["400", "600", "700"],
})

export const metadata: Metadata = {
  title: "Banafix | Learn the instrument you've always meant to play",
  description:
    "One-on-one music tuition with performing musicians in Lekki, Lagos. Learn at our studio, at your home, or online. Browse the courses and enrol on the format that fits your week.",
  keywords: ["music academy", "violin lessons", "guitar lessons", "music school nigeria", "online music classes"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${instrumentSerif.variable} ${jakarta.variable}`}
    >
      <body
        className={`font-sans ${inter.variable} ${sora.variable} ${instrumentSerif.variable} ${jakarta.variable} ${GeistMono.variable} antialiased`}
      >
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
