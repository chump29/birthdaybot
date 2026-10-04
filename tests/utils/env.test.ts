import { describe, expect, test } from "bun:test"

import { expectTypeOf } from "expect-type"

import { env } from "../../utils/env.ts"

describe("env", (): void => {
  test("ACTIVITY", (): void => {
    expectTypeOf(env.ACTIVITY).toEqualTypeOf<string>()

    expect(env.ACTIVITY.length).toBeGreaterThan(0)
  })

  test("CHANNEL_ID", (): void => {
    expectTypeOf(env.CHANNEL_ID).toEqualTypeOf<string>()

    expect(env.CHANNEL_ID.length).toBeGreaterThan(0)
  })

  test("COLOR", (): void => {
    expectTypeOf(env.COLOR).toEqualTypeOf<string>()

    const LEN: number = 7

    expect(env.COLOR).toHaveLength(LEN)
  })

  test("DB_NAME", (): void => {
    expectTypeOf(env.DB_NAME).toEqualTypeOf<string>()

    expect(env.DB_NAME.length).toBeGreaterThan(0)
  })

  test("DB_PATH", (): void => {
    expectTypeOf(env.DB_PATH).toEqualTypeOf<string>()

    expect(env.DB_PATH.length).toBeGreaterThan(0)
  })

  test("DEBUG", (): void => {
    expectTypeOf(env.DEBUG).toEqualTypeOf<boolean>()

    expect(env.DEBUG).toBeTrue()
  })

  test("GUILD_ID", (): void => {
    expectTypeOf(env.GUILD_ID).toEqualTypeOf<string>()

    expect(env.GUILD_ID.length).toBeGreaterThan(0)
  })

  test("LOGO_NAME", (): void => {
    expectTypeOf(env.LOGO_NAME).toEqualTypeOf<string>()

    expect(env.LOGO_NAME.length).toBeGreaterThan(0)
  })

  test("LOGO_PATH", (): void => {
    expectTypeOf(env.LOGO_PATH).toEqualTypeOf<string>()

    expect(env.LOGO_PATH.length).toBeGreaterThan(0)
  })

  test("LOGO_PORT", (): void => {
    expectTypeOf(env.LOGO_PORT).toEqualTypeOf<number | "random">()

    expect(env.LOGO_PORT).toBe("random")
  })

  test("LOGO_URL", (): void => {
    expectTypeOf(env.LOGO_URL).toEqualTypeOf<string>()

    expect(env.LOGO_URL.length).toBeGreaterThan(0)
  })

  test("LOGO2_NAME", (): void => {
    expectTypeOf(env.LOGO2_NAME).toEqualTypeOf<string>()

    expect(env.LOGO2_NAME.length).toBeGreaterThan(0)
  })

  test("LOGO2_PATH", (): void => {
    expectTypeOf(env.LOGO2_PATH).toEqualTypeOf<string>()

    expect(env.LOGO2_PATH.length).toBeGreaterThan(0)
  })

  test("LOGO2_URL", (): void => {
    expectTypeOf(env.LOGO2_URL).toEqualTypeOf<string>()

    expect(env.LOGO2_URL.length).toBeGreaterThan(0)
  })

  test("NAME", (): void => {
    expectTypeOf(env.NAME).toEqualTypeOf<string>()

    expect(env.NAME.length).toBeGreaterThan(0)
  })

  test("ROLE_ID", (): void => {
    expectTypeOf(env.ROLE_ID).toEqualTypeOf<string>()

    expect(env.ROLE_ID.length).toBeGreaterThan(0)
  })

  test("TOKEN", (): void => {
    expectTypeOf(env.TOKEN).toEqualTypeOf<string>()

    expect(env.TOKEN.length).toBeGreaterThan(0)
  })
})
