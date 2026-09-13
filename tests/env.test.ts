import { describe, expect, test } from "bun:test"

import { expectTypeOf } from "expect-type"

import { env } from "../utils/env.ts"

const {
  CHANNEL_ID,
  COLOR,
  DB_NAME,
  DB_PATH,
  DEBUG,
  GUILD_ID,
  LOGO_NAME,
  LOGO_PATH,
  LOGO_PORT,
  LOGO_URL,
  LOGO2_NAME,
  LOGO2_PATH,
  LOGO2_URL,
  NAME,
  ROLE_ID,
  TOKEN
} = env as typeof env

describe("env", (): void => {
  test("CHANNEL_ID", (): void => {
    expectTypeOf(CHANNEL_ID).toEqualTypeOf<string>()

    expect(CHANNEL_ID.length).toBeGreaterThan(0)
  })

  test("COLOR", (): void => {
    expectTypeOf(COLOR).toEqualTypeOf<string>()

    const LEN: number = 6

    expect(COLOR).toHaveLength(LEN)
  })

  test("DB_NAME", (): void => {
    expectTypeOf(DB_NAME).toEqualTypeOf<string>()

    expect(DB_NAME.length).toBeGreaterThan(0)
  })

  test("DB_PATH", (): void => {
    expectTypeOf(DB_PATH).toEqualTypeOf<string>()

    expect(DB_PATH.length).toBeGreaterThan(0)
  })

  test("DEBUG", (): void => {
    expectTypeOf(DEBUG).toEqualTypeOf<boolean>()

    expect(DEBUG).toBeTrue()
  })

  test("GUILD_ID", (): void => {
    expectTypeOf(GUILD_ID).toEqualTypeOf<string>()

    expect(GUILD_ID.length).toBeGreaterThan(0)
  })

  test("LOGO_NAME", (): void => {
    expectTypeOf(LOGO_NAME).toEqualTypeOf<string>()

    expect(LOGO_NAME.length).toBeGreaterThan(0)
  })

  test("LOGO_PATH", (): void => {
    expectTypeOf(LOGO_PATH).toEqualTypeOf<string>()

    expect(LOGO_PATH.length).toBeGreaterThan(0)
  })

  test("LOGO_PORT", (): void => {
    expectTypeOf(LOGO_PORT).toEqualTypeOf<number | "random">()

    expect(LOGO_PORT).toBe("random")
  })

  test("LOGO_URL", (): void => {
    expectTypeOf(LOGO_URL).toEqualTypeOf<string>()

    expect(LOGO_URL.length).toBeGreaterThan(0)
  })

  test("LOGO2_NAME", (): void => {
    expectTypeOf(LOGO2_NAME).toEqualTypeOf<string>()

    expect(LOGO2_NAME.length).toBeGreaterThan(0)
  })

  test("LOGO2_PATH", (): void => {
    expectTypeOf(LOGO2_PATH).toEqualTypeOf<string>()

    expect(LOGO2_PATH.length).toBeGreaterThan(0)
  })

  test("LOGO2_URL", (): void => {
    expectTypeOf(LOGO2_URL).toEqualTypeOf<string>()

    expect(LOGO2_URL.length).toBeGreaterThan(0)
  })

  test("NAME", (): void => {
    expectTypeOf(NAME).toEqualTypeOf<string>()

    expect(NAME.length).toBeGreaterThan(0)
  })

  test("ROLE_ID", (): void => {
    expectTypeOf(ROLE_ID).toEqualTypeOf<string>()

    expect(ROLE_ID.length).toBeGreaterThan(0)
  })

  test("TOKEN", (): void => {
    expectTypeOf(TOKEN).toEqualTypeOf<string>()

    expect(TOKEN.length).toBeGreaterThan(0)
  })
})
