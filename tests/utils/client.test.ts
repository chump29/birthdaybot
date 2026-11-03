import { default as process } from "node:process"

import { beforeAll, describe, expect, spyOn, test } from "bun:test"

import { simpleFaker as fake } from "@faker-js/faker"
import { type ClientUser, type Client as DiscordClient } from "discord.js"

import { Client } from "../../utils/client.ts"
import { env } from "../../utils/env.ts"

const infoSpy = spyOn(console, "info")
if (!env.TEST_FULL) {
  infoSpy.mockImplementation((): void => undefined)
}

// biome-ignore lint/nursery/noUnsafeTypeAssertion: keep from shutting down tests
const exitSpy = spyOn(process, "exit").mockImplementation((): never => undefined as never)

const tag = `${env.NAME}#${fake.string.numeric({ allowLeadingZeros: false, length: 4 })}`

beforeAll(async (): Promise<void> => {
  await Client.init(
    createMock<DiscordClient>({
      user: createMock<ClientUser>({
        displayName: env.NAME,
        tag
      })
    })
  )
})

describe("client", (): void => {
  test("init", async (): Promise<void> => {
    await Client.shutdown("TEST")

    const TIMES = 13
    expect(infoSpy).toHaveBeenCalledTimes(TIMES)

    const LINE_NUM = 5
    expect(infoSpy).toHaveBeenNthCalledWith(LINE_NUM, expect.any(String), expect.stringContaining(env.NAME))
    expect(infoSpy).toHaveBeenNthCalledWith(LINE_NUM, expect.any(String), expect.stringContaining(tag))

    expect(exitSpy).toHaveBeenCalledOnce()
    expect(exitSpy).toHaveBeenCalledWith(0)

    await Client.shutdown() // * NOTE: tests isShutdown
  })
})
