import type { Metadata } from "next"
import { Inter, Sora } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Marviotone - Master Violin and String Instruments",
  description: "Nigeria's premier music academy. Learn violin, guitar, piano, drums, and more with expert tutors. Flexible online and in-person classes available.",
  keywords: ["music academy", "violin lessons", "guitar lessons", "music school nigeria", "online music classes"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
