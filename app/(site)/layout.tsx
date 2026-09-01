import type React from "react"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

/**
 * Public site shell — the outer <div> of "Banafix Redesign.dc.html"
 * (`min-height:100vh; display:flex; flex-direction:column`) with the sticky
 * header above and the ink footer below.
 *
 * `bfx-site` carries the cream ground and Plus Jakarta Sans face. It lives
 * here rather than on <body> so /admin keeps its existing white + Inter/Sora
 * treatment untouched.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bfx-site flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
