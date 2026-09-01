import type { NextConfig } from "next";

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
