import { default as process } from "node:process"

import { afterEach, beforeAll, beforeEach, describe, expect, jest, spyOn, test } from "bun:test"

import { simpleFaker as fake } from "@faker-js/faker"
import { type ClientUser, type Client as DiscordClient } from "discord.js"

import { Client } from "../../utils/client.ts"
import { env } from "../../utils/env.ts"

const infoSpy: jest.Mock = spyOn(console, "info")

const onSpy: jest.Mock = spyOn(process, "on")

const tag: string = `${env.NAME}#${fake.string.numeric({ allowLeadingZeros: false, length: 4 })}`

beforeAll((): void => {
  infoSpy.mockReset()
})

beforeEach(async (): Promise<void> => {
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

afterEach(async (): Promise<void> => {
  await Client.shutdown()
})

describe("client", (): void => {
  test("init", (): void => {
    const count: number = 5

    expect(infoSpy).toHaveBeenCalledTimes(count)

    expect(infoSpy).toHaveBeenNthCalledWith(count, expect.any(String), expect.stringContaining(env.NAME))
    expect(infoSpy).toHaveBeenNthCalledWith(count, expect.any(String), expect.stringContaining(tag))

    process.emit("SIGINT")
    expect(onSpy).toHaveBeenNthCalledWith(1, "SIGINT", expect.any(Function))

    process.emit("SIGTERM")
    expect(onSpy).toHaveBeenNthCalledWith(2, "SIGTERM", expect.any(Function))
  })
})
