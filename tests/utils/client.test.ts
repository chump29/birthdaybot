import { default as process } from "node:process"

import { beforeAll, describe, expect, jest, spyOn, test } from "bun:test"

import { simpleFaker as fake } from "@faker-js/faker"
import { type ClientUser, type Client as DiscordClient } from "discord.js"

import { Client } from "../../utils/client.ts"
import { env } from "../../utils/env.ts"

let infoSpy: jest.Mock
let exitSpy: jest.Mock

const tag: string = `${env.NAME}#${fake.string.numeric({ allowLeadingZeros: false, length: 4 })}`

beforeAll(async (): Promise<void> => {
  infoSpy = spyOn(console, "info").mockImplementation((): void => undefined) // suppress
  exitSpy = spyOn(process, "exit").mockImplementation((): never => undefined as never)

  await Client.init({
    destroy: jest.fn().mockResolvedValue(undefined),
    login: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    once: jest.fn(),
    user: {
      displayName: env.NAME,
      tag
    } as ClientUser
  } as unknown as DiscordClient)
})

describe("client", (): void => {
  test("init", async (): Promise<void> => {
    await Client.shutdown()

    const TIMES: number = 11
    expect(infoSpy).toHaveBeenCalledTimes(TIMES)

    const LINE_NUM: number = 5
    expect(infoSpy).toHaveBeenNthCalledWith(LINE_NUM, expect.any(String), expect.stringContaining(env.NAME))
    expect(infoSpy).toHaveBeenNthCalledWith(LINE_NUM, expect.any(String), expect.stringContaining(tag))

    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(0)
  })
})
