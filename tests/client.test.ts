import { default as process } from "node:process"

import { beforeAll, describe, expect, jest, mock, spyOn, test } from "bun:test"

import { simpleFaker as fake } from "@faker-js/faker"
import {
  type ActivitiesOptions,
  ActivityType,
  type Client,
  type ClientUser,
  GatewayIntentBits,
  type IntentsBitField,
  type PresenceData
} from "discord.js"

import { login, setup, shutdown } from "../utils/client.ts"
import { env } from "../utils/env.ts"

const { NAME }: typeof env = env

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

  test("login fail - client", (): void => {
    expect(login()).rejects.toThrowError("Invalid CLIENT")
  })

  test("client", async (): Promise<void> => {
    const onSpy: jest.Mock = spyOn(process, "on")

    const clientObj: Client = await setup()

    const intents: IntentsBitField = clientObj.options.intents
    expect(intents).not.toBeUndefined()
    expect(intents.has(GatewayIntentBits.Guilds)).toBeTrue()
    expect(intents.has(GatewayIntentBits.GuildMembers)).toBeTrue()

    const presence: PresenceData = clientObj.options.presence as PresenceData
    const activities: ActivitiesOptions[] = presence.activities as ActivitiesOptions[]
    expect(activities).not.toBeUndefined()
    expect(activities).toHaveLength(1)
    expect(activities[0]?.name).toBe("Partying...")
    expect(activities[0]?.type).toBe(ActivityType.Custom)

    process.emit("SIGINT")
    expect(onSpy).toHaveBeenNthCalledWith(1, "SIGINT", expect.any(Function))

    process.emit("SIGTERM")
    expect(onSpy).toHaveBeenNthCalledWith(2, "SIGTERM", expect.any(Function))
  })

  test("login", async (): Promise<void> => {
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

    infoSpy.mockClear()

    const client: Client = await login()

    expect(client.user?.displayName).toBe(NAME)
    expect(client.user?.tag).toBe(tag)

    expect(infoSpy).toHaveBeenCalledTimes(2)
  })
})
