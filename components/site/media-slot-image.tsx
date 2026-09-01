"use client"

/**
 * The <img> half of MediaSlot, split out as a client leaf so it can unmount
 * itself on error.
 *
 * This is not defensive theatre: the one live Instructor row points `avatar`
 * at `/instructor-john.jpg`, which does not exist in `public/`. Without this,
 * the browser paints alt text and a broken-image icon at `z-[1]`, directly on
 * top of the designed gradient empty state sitting at `z-0` — the fallback is
 * there but covered up. Dropping the element lets it show through.
 */

import { useState } from "react"

import { cn } from "@/lib/utils"

export function MediaSlotImage({
  src,
  alt,
  loading,
  className,
}: {
  src: string
  alt: string
  loading?: "lazy" | "eager"
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={cn("relative z-[1] h-full w-full object-cover", className)}
    />
  )
}
