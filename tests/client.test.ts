import { default as process } from "node:process"

import { beforeAll, describe, expect, jest, mock, spyOn, test } from "bun:test"

import { simpleFaker as fake } from "@faker-js/faker"
import { type Client, type ClientUser } from "discord.js"

import { init, shutdown } from "../utils/client.ts"
import { env } from "../utils/env.ts"

const { NAME } = env as typeof env

const infoSpy: jest.Mock = spyOn(console, "info")

beforeAll((): void => {
  infoSpy.mockReset()
})

describe("client", (): void => {
  test("shutdown", (): void => {
    mock.module("../utils/db.ts", (): unknown => ({
      DB: {
        close: jest.fn()
      }
    }))

    spyOn(process, "exit").mockImplementation((code: number): never => {
      throw new Error(code.toString())
    })

    expect(shutdown("TEST")).rejects.toThrowError("0")

    const count: number = 4

    expect(infoSpy).toHaveBeenCalledTimes(count)

    shutdown("TEST") // * NOTE: to test isShutdown
  })

  test("init", async (): Promise<void> => {
    infoSpy.mockClear()

    const tag: string = `${NAME}#${fake.string.numeric({ allowLeadingZeros: false, length: 4 })}`

    mock.module("../utils/client.ts", (): unknown => ({
      TEST_CLIENT: {
        login: jest.fn(),
        user: {
          displayName: NAME,
          tag
        } as ClientUser
      } as unknown as Client
    }))

    const onSpy: jest.Mock = spyOn(process, "on")

    await init()

    const count: number = 5

    expect(infoSpy).toHaveBeenCalledTimes(count)
    expect(infoSpy).toHaveBeenNthCalledWith(count, expect.any(String), expect.stringContaining(NAME))
    expect(infoSpy).toHaveBeenNthCalledWith(count, expect.any(String), expect.stringContaining(tag))

    process.emit("SIGINT")
    expect(onSpy).toHaveBeenNthCalledWith(1, "SIGINT", expect.any(Function))

    process.emit("SIGTERM")
    expect(onSpy).toHaveBeenNthCalledWith(2, "SIGTERM", expect.any(Function))
  })
})
