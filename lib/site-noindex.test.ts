import { describe, expect, it } from "vitest"

import { isNoindex } from "@/lib/site-noindex"

describe("isNoindex", () => {
  it("is on only for an explicit true/1", () => {
    expect(isNoindex("true")).toBe(true)
    expect(isNoindex("TRUE")).toBe(true)
    expect(isNoindex(" 1 ")).toBe(true)
  })

  it("is off when unset, empty or anything else, so a typo never hides the live site by accident", () => {
    expect(isNoindex(undefined)).toBe(false)
    expect(isNoindex("")).toBe(false)
    expect(isNoindex("false")).toBe(false)
    expect(isNoindex("yes")).toBe(false)
  })
})
