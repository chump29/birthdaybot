// biome-ignore-all lint/nursery/useLowercaseTestTitle: using env names

import { describe, expect, test } from "bun:test"

import { type HexColorString } from "discord.js"
import { expectTypeOf } from "expect-type"

import { env } from "../../utils/env.ts"

describe("env", (): void => {
  test("ACTIVITY", (): void => {
    expect(env.ACTIVITY).toBeString()

    expect(env.ACTIVITY.length).toBeGreaterThan(0)
  })

  test("CHANNEL_ID", (): void => {
    expect(env.CHANNEL_ID).toBeString()

    expect(env.CHANNEL_ID.length).toBeGreaterThan(0)
  })

  test("COLOR", (): void => {
    expectTypeOf(env.COLOR).toEqualTypeOf<HexColorString>()

    const LEN = 7

    expect(env.COLOR).toHaveLength(LEN)
  })

  test("DB_NAME", (): void => {
    expect(env.DB_NAME).toBeString()

    expect(env.DB_NAME.length).toBeGreaterThan(0)
  })

  test("DB_PATH", (): void => {
    expect(env.DB_PATH).toBeString()

    expect(env.DB_PATH.length).toBeGreaterThan(0)
  })

  test("DEBUG", (): void => {
    expect(env.DEBUG).toBeBoolean()

    expect(env.DEBUG).toBeTrue()
  })

  test("GUILD_ID", (): void => {
    expect(env.GUILD_ID).toBeString()

    expect(env.GUILD_ID.length).toBeGreaterThan(0)
  })

  test("LOGO_NAME", (): void => {
    expect(env.LOGO_NAME).toBeString()

    expect(env.LOGO_NAME.length).toBeGreaterThan(0)
  })

  test("LOGO_PATH", (): void => {
    expect(env.LOGO_PATH).toBeString()

    expect(env.LOGO_PATH.length).toBeGreaterThan(0)
  })

  test("LOGO_PORT", (): void => {
    expectTypeOf(env.LOGO_PORT).toEqualTypeOf<number | "random">()

    expect(env.LOGO_PORT).toBe("random")
  })

  test("LOGO_URL", (): void => {
    expect(env.LOGO_URL).toBeString()

    expect(env.LOGO_URL.length).toBeGreaterThan(0)
  })

  test("NAME", (): void => {
    expect(env.NAME).toBeString()

    expect(env.NAME.length).toBeGreaterThan(0)
  })

  test("ROLE_ID", (): void => {
    expect(env.ROLE_ID).toBeString()

    expect(env.ROLE_ID.length).toBeGreaterThan(0)
  })

  test("TEST_FULL", (): void => {
    expect(env.TEST_FULL).toBeBoolean()
  })

  test("TOKEN", (): void => {
    expect(env.TOKEN).toBeString()

    expect(env.TOKEN.length).toBeGreaterThan(0)
  })
})
