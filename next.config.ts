import type { NextConfig } from "next";

import { isNoindex } from "./lib/site-noindex";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "purepng.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Staff-review mode (SITE_NOINDEX=true): also send the header, so /api and
  // /admin and non-HTML responses are covered, not just pages with the meta tag.
  async headers() {
    if (!isNoindex()) return []
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
  },
  async redirects() {
    return [
      // The handoff renames "Instructors" to "Tutors". Permanent so existing
      // links and any indexed URLs follow.
      { source: "/instructors", destination: "/tutors", permanent: true },
      // There is no tutor detail screen in the handoff, and the old
      // /instructors/[id] page was a hardcoded mock that ignored its param.
      { source: "/instructors/:id", destination: "/tutors", permanent: true },
      { source: "/tutors/:id", destination: "/tutors", permanent: true },
    ]
  },
};

export default nextConfig;
