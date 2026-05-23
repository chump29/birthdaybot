import { describe, expect, jest, mock, spyOn, test } from "bun:test"

import {
  type ActivitiesOptions,
  ActivityType,
  type Client,
  type ClientUser,
  GatewayIntentBits,
  type IntentsBitField,
  type PresenceData
} from "discord.js"

import { fake } from "@nano-faker/patterns"

import { client, login, shutdown } from "./client.ts"

describe("client", (): void => {
  spyOn(process, "exit").mockImplementation((code: number): never => {
    throw new Error(code.toString())
  })

  test("shutdown", async (): Promise<void> => {
    mock.module("./db.ts", (): unknown => {
      return {
        closeDatabase: jest.fn().mockResolvedValue(null)
      }
    })

    expect(shutdown("TEST")).rejects.toThrowError("0")

    await shutdown("TEST2") // * NOTE: to test isShutdown
  })

  test("login fail - client", (): void => {
    expect(login()).rejects.toThrowError("Invalid CLIENT")
  })

  test("client", async (): Promise<void> => {
    const onSpy: jest.Mock = spyOn(process, "on")

    const clientObj: Client = await client()
    expect(clientObj).not.toBeUndefined()

    const intents: IntentsBitField = clientObj.options.intents
    expect(intents.has(GatewayIntentBits.Guilds)).toBeTrue()

    const presence: PresenceData = clientObj.options.presence as PresenceData
    const activities: ActivitiesOptions[] = presence.activities as ActivitiesOptions[]
    expect(activities).not.toBeUndefined()
    expect(activities[0]?.name === "Partying...").toBeTrue()
    expect(activities[0]?.type === ActivityType.Custom).toBeTrue()

    mock.module("./client.ts", (): unknown => {
      return {
        shutdown: jest.fn()
      }
    })

    process.emit("SIGINT")
    expect(onSpy).toHaveBeenNthCalledWith(1, "SIGINT", expect.any(Function))

    process.emit("SIGTERM")
    expect(onSpy).toHaveBeenNthCalledWith(2, "SIGTERM", expect.any(Function))
  })

  test("login fail - token", (): void => {
    expect(login()).rejects.toThrowError("Invalid TOKEN")
  })

  test("login pass", async (): Promise<void> => {
    mock.module("./client.ts", (): unknown => {
      return {
        TEST_CLIENT: {
          login: jest.fn(),
          user: {
            displayName: Bun.env.NAME,
            tag: `${Bun.env.NAME}#${fake("####")}`
          } as ClientUser
        } as unknown as Client
      }
    })

    const ID_LEN: number = 26
    const TS_LEN: number = 6
    const HMAC_LEN: number = 38

    Bun.env.TOKEN = fake(`${"*".repeat(ID_LEN)}.${"*".repeat(TS_LEN)}.${"*".repeat(HMAC_LEN)}`)

    const loginObj: Client = await login()
    expect(loginObj).not.toBeUndefined()
    expect(loginObj.user?.displayName === Bun.env.NAME).toBeTrue()
  })
})
