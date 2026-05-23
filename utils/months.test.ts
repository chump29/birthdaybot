import { describe, expect, test } from "bun:test"

import months from "./months.ts"

describe("months.ts", (): void => {
  test("months", (): void => {
    const NUM_MONTHS: number = 12
    expect(months.length).toBe(NUM_MONTHS + 1)

    expect(months.at(-1)).toBe("December")
  })
})
