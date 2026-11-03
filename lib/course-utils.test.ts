import { describe, expect, it } from "vitest"

import { normalizeWeeks } from "@/lib/course-utils"

describe("normalizeWeeks", () => {
  it("trims a timeframe", () => {
    expect(normalizeWeeks("  Weeks 1-2 ")).toBe("Weeks 1-2")
  })

  it("stores blank input as null, not an empty string", () => {
    expect(normalizeWeeks("")).toBeNull()
    expect(normalizeWeeks("   ")).toBeNull()
  })

  it("treats missing and non-string input as null", () => {
    expect(normalizeWeeks(undefined)).toBeNull()
    expect(normalizeWeeks(null)).toBeNull()
    expect(normalizeWeeks(12)).toBeNull()
  })
})
