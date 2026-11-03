import type { MetadataRoute } from "next"

import { isNoindex } from "@/lib/site-noindex"

export default function robots(): MetadataRoute.Robots {
  if (isNoindex()) {
    return { rules: { userAgent: "*", disallow: "/" } }
  }
  // /admin and /api are never meant to be indexed, even at launch.
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] } }
}
