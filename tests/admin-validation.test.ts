import { describe, expect, it } from "vitest"
import {
  isNonNegativeInt,
  validateDurationMins,
  validateClassesPerWeekOptions,
  validateRates,
  slugify,
  uniqueSlug,
} from "@/lib/admin-validation"

describe("isNonNegativeInt", () => {
  it("accepts 0 and positive integers", () => {
    expect(isNonNegativeInt(0)).toBe(true)
    expect(isNonNegativeInt(5000)).toBe(true)
  })
  it("rejects negatives, floats, strings, NaN, null", () => {
    expect(isNonNegativeInt(-1)).toBe(false)
    expect(isNonNegativeInt(1.5)).toBe(false)
    expect(isNonNegativeInt("5")).toBe(false)
    expect(isNonNegativeInt(NaN)).toBe(false)
    expect(isNonNegativeInt(null)).toBe(false)
  })
})

describe("validateDurationMins", () => {
  it("accepts integers 15..240", () => {
    expect(validateDurationMins(15)).toBe(true)
    expect(validateDurationMins(45)).toBe(true)
    expect(validateDurationMins(240)).toBe(true)
  })
  it("rejects out of range and non-integers", () => {
    expect(validateDurationMins(14)).toBe(false)
    expect(validateDurationMins(241)).toBe(false)
    expect(validateDurationMins(45.5)).toBe(false)
    expect(validateDurationMins("60")).toBe(false)
  })
})

describe("validateClassesPerWeekOptions", () => {
  it("accepts a non-empty array of integers 1..7", () => {
    expect(validateClassesPerWeekOptions([1, 2])).toBe(true)
    expect(validateClassesPerWeekOptions([7])).toBe(true)
  })
  it("rejects empty, out of range, non-integers, non-arrays", () => {
    expect(validateClassesPerWeekOptions([])).toBe(false)
    expect(validateClassesPerWeekOptions([0])).toBe(false)
    expect(validateClassesPerWeekOptions([8])).toBe(false)
    expect(validateClassesPerWeekOptions([1.5])).toBe(false)
    expect(validateClassesPerWeekOptions("1,2")).toBe(false)
  })
})

describe("validateRates", () => {
  it("accepts a valid list (including empty)", () => {
    expect(validateRates([])).toBeNull()
    expect(validateRates([{ durationMins: 45, pricePerClass: 5000 }])).toBeNull()
  })
  it("rejects bad shape, bad values and duplicate durations", () => {
    expect(validateRates("x")).not.toBeNull()
    expect(validateRates([{ durationMins: 10, pricePerClass: 5000 }])).toMatch(/duration/i)
    expect(validateRates([{ durationMins: 45, pricePerClass: -1 }])).toMatch(/price/i)
    expect(
      validateRates([
        { durationMins: 45, pricePerClass: 1 },
        { durationMins: 45, pricePerClass: 2 },
      ]),
    ).toMatch(/duplicate/i)
  })
})

describe("slugify / uniqueSlug", () => {
  it("lowercases, collapses non-alphanumerics and trims dashes", () => {
    expect(slugify("Lagos Island")).toBe("lagos-island")
    expect(slugify("  Abuja (FCT)! ")).toBe("abuja-fct")
  })
  it("appends -2, -3 on collision", () => {
    expect(uniqueSlug("lagos", new Set())).toBe("lagos")
    expect(uniqueSlug("lagos", new Set(["lagos"]))).toBe("lagos-2")
    expect(uniqueSlug("lagos", new Set(["lagos", "lagos-2"]))).toBe("lagos-3")
  })
})
