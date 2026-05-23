import { describe, expect, jest, mock, spyOn, test } from "bun:test"

import {
  type ChannelManager,
  type ChatInputCommandInteraction,
  type Client,
  type CommandInteractionOptionResolver,
  type Guild,
  type GuildManager,
  type GuildMember,
  type GuildMemberManager,
  type GuildMemberRoleManager,
  type Role,
  type RoleManager,
  type TextChannel,
  type User
} from "discord.js"

import { username } from "@nano-faker/internet"
import { fake } from "@nano-faker/patterns"

import { type IBirthday } from "../db/schema.ts"
import {
  addBirthday,
  BIRTHDAYS,
  COUNT,
  deleteBirthday,
  doBirthdays,
  handleBirthdays,
  loadSettings
} from "./loadBirthdays.ts"

describe("loadBirthdays", (): void => {
  const ID_LEN: number = 19
  const getId = (): string => fake("#".repeat(ID_LEN))

  const date: Date = new Date()

  const role: Role = {
    id: getId()
  } as Role

  const rolesCache: Map<string, Role> = new Map<string, Role>()

  test("doBirthdays - no client", (): void => {
    expect(doBirthdays()).rejects.toThrowError("Invalid CLIENT")
  })

  const channelManager: ChannelManager = {
    fetch: jest.fn().mockResolvedValue({
      send: jest.fn()
    } as unknown as TextChannel)
  } as unknown as ChannelManager

  const client: Client = {
    channels: channelManager,
    guilds: {
      fetch: jest.fn().mockResolvedValue({
        members: {
          fetch: jest.fn().mockResolvedValue({
            displayAvatarURL: jest.fn(),
            displayName: username(),
            roles: {
              add: jest.fn().mockImplementation(async (): Promise<void> => {
                rolesCache.set("TEST", role)
              }),
              cache: rolesCache,
              remove: jest.fn().mockImplementation((): void => {
                rolesCache.delete("TEST")
              })
            } as unknown as GuildMemberRoleManager
          } as unknown as GuildMember)
        } as unknown as GuildMemberManager,
        roles: {
          fetch: jest.fn().mockResolvedValue(role)
        } as unknown as RoleManager
      } as Guild)
    } as unknown as GuildManager
  } as Client

  test("loadSettings", async (): Promise<void> => {
    Bun.env.CHANNEL_ID = getId()

    const birthdays: IBirthday[] = [
      {
        day: date.getDate(),
        month: date.getMonth() + 1,
        user_id: getId()
      } as IBirthday
    ] as IBirthday[]

    mock.module("./db.ts", (): unknown => {
      return {
        deleteBirthday: jest.fn().mockImplementation(async (): Promise<void> => {
          birthdays.pop()
        }),
        getBirthdays: jest.fn().mockResolvedValue(birthdays)
      }
    })

    await loadSettings(client)

    expect(COUNT).toEqual(1)
  })

  const newId: string = getId()

  const interaction = {
    options: {
      getInteger: jest.fn().mockImplementation((name: string): number => {
        if (name === "month") {
          return date.getMonth() + 1
        } else {
          return date.getDate()
        }
      })
    } as unknown as CommandInteractionOptionResolver,
    user: {
      displayName: username(),
      id: newId
    } as User
  } as unknown as ChatInputCommandInteraction

  test("addBirthday", async (): Promise<void> => {
    mock.module("./db.ts", (): unknown => {
      return {
        addBirthday: jest.fn().mockImplementation(async (userId: string, month: number, day: number): Promise<void> => {
          BIRTHDAYS.push({
            day: day,
            month: month,
            user_id: userId
          } as IBirthday)
        })
      }
    })

    await addBirthday(interaction)

    expect(COUNT).toBe(2)
    expect(BIRTHDAYS[1]?.user_id).toBe(newId)
  })

  test("deleteBirthday", async (): Promise<void> => {
    await deleteBirthday(newId)

    expect(COUNT).toBe(1)
  })

  test("handleBirthdays", async (): Promise<void> => {
    const onSpy: jest.Mock = spyOn(process, "on")
    const consoleSpy: jest.Mock = spyOn(console, "error")

    await handleBirthdays()

    process.emit("unhandledRejection", "TEST")

    expect(onSpy).toHaveBeenCalledWith("unhandledRejection", expect.any(Function))
    expect(consoleSpy).toHaveBeenNthCalledWith(2, expect.any(String), expect.stringContaining("TEST"))
  })

  Bun.env.GUILD_ID = getId()
  Bun.env.ROLE_ID = getId()

  test("doBirthdays - add", async (): Promise<void> => {
    await doBirthdays()

    expect(rolesCache.has("TEST")).toBeTrue()
  })

  test("doBirthdays - delete", async (): Promise<void> => {
    if (BIRTHDAYS[0]) {
      BIRTHDAYS[0].day = date.getDate() + 1
    }

    await doBirthdays()

    expect(rolesCache.has("TEST")).toBeFalse()
  })

  test("loadSettings - no client", (): void => {
    // biome-ignore lint/suspicious/noExplicitAny: for testing
    expect(loadSettings(null as any)).rejects.toThrowError("Invalid CLIENT")
  })

  test("loadSettings/getChannel - no channelId", (): void => {
    Bun.env.CHANNEL_ID = ""

    expect(loadSettings({} as Client)).rejects.toThrowError("Invalid CHANNEL_ID")
  })

  test("loadSettings/getChannel - no channel", (): void => {
    Bun.env.CHANNEL_ID = getId()

    expect(
      loadSettings({
        channels: {
          fetch: jest.fn().mockResolvedValue(null)
        } as unknown as ChannelManager
      } as Client)
    ).rejects.toThrowError("Invalid channel")
  })

  test("doBirthdays - no guildId", () => {
    Bun.env.GUILD_ID = ""

    expect(doBirthdays()).rejects.toThrowError("Invalid GUILD_ID")
  })

  test("doBirthdays - no roleId", async (): Promise<void> => {
    await loadSettings(client)

    Bun.env.GUILD_ID = getId()
    Bun.env.ROLE_ID = ""

    expect(doBirthdays()).rejects.toThrowError("Invalid ROLE_ID")
  })
})
