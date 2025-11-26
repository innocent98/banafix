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
  title: "Banafix - Master Violin and String Instruments",
  description: "Nigeria's premier music academy. Learn violin, guitar, piano, drums, and more with expert tutors. Flexible online and in-person classes available.",
  keywords: ["music academy", "violin lessons", "guitar lessons", "music school nigeria", "online music classes"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className={`font-sans ${inter.variable} ${sora.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
