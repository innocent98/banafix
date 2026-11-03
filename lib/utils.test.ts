import { describe, expect, it } from "vitest"

import { cn } from "@/lib/utils"

describe("cn", () => {
  it("joins class names and lets the later Tailwind utility win", () => {
    expect(cn("px-2", false, "px-4", "font-bold")).toBe("px-4 font-bold")
  })
})
