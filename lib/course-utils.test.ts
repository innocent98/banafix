import { describe, expect, it } from "vitest"

import { buildCurriculumRows, buildFaqRows, normalizeWeeks } from "@/lib/course-utils"

describe("buildCurriculumRows", () => {
  it("numbers modules and orders them from 1, in the order given", () => {
    const rows = buildCurriculumRows([
      { title: "Basics", weeks: " Weeks 1-2 ", outcomes: ["a"], tasks: ["t"] },
      { title: "Chords" },
    ])
    expect(rows).toEqual([
      { module: 1, order: 1, title: "Basics", weeks: "Weeks 1-2", outcomes: ["a"], tasks: ["t"] },
      { module: 2, order: 2, title: "Chords", weeks: null, outcomes: [], tasks: [] },
    ])
  })

  it("drops rows without a title and renumbers the survivors", () => {
    const rows = buildCurriculumRows([{ title: "  " }, { title: "Scales" }, { weeks: "x" }])
    expect(rows.map((r) => [r.module, r.title])).toEqual([[1, "Scales"]])
  })

  it("drops blank outcome/task strings and ignores non-array or non-object input", () => {
    expect(buildCurriculumRows(undefined)).toEqual([])
    expect(buildCurriculumRows("nope")).toEqual([])
    expect(buildCurriculumRows([null, 4])).toEqual([])
    const [row] = buildCurriculumRows([{ title: "M", outcomes: ["ok", "", "  ", 3], tasks: "x" }])
    expect(row.outcomes).toEqual(["ok"])
    expect(row.tasks).toEqual([])
  })
})

describe("buildFaqRows", () => {
  it("keeps only rows with both a question and an answer, ordered from 1", () => {
    const rows = buildFaqRows([
      { question: " Q1 ", answer: " A1 " },
      { question: "Q2", answer: "" },
      { answer: "A3" },
      { question: "Q4", answer: "A4" },
    ])
    expect(rows).toEqual([
      { question: "Q1", answer: "A1", order: 1 },
      { question: "Q4", answer: "A4", order: 2 },
    ])
  })

  it("returns an empty list for non-array input", () => {
    expect(buildFaqRows(undefined)).toEqual([])
    expect(buildFaqRows({})).toEqual([])
  })
})

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
