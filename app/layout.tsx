import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { Inter } from "next/font/google"
import { Sora } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora",
  weight: ["400", "600", "700"],
})

export const metadata: Metadata = {
  title: "Banafix - Master Your Sound",
  description:
    "Professional music education platform offering expert instruction across 20+ instruments with certified tutors and structured curriculum.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable} ${sora.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
