import { default as assert } from "node:assert/strict"
import { readdir } from "node:fs/promises"
import { default as path } from "node:path"

import { afterAll, beforeAll, describe, expect, jest, spyOn, test } from "bun:test"

import { type Optional } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"
import { default as dayjs } from "dayjs"
import {
  type ChatInputCommandInteraction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type User
} from "discord.js"
import { match, P } from "ts-pattern"

import { birthdays, type IBirthday, MAX_USER_ID_LEN, MIN_USER_ID_LEN } from "../../db/schema.ts"
import { author, version } from "../../package.json" with { type: "json" }
import { DB } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"

interface ICommandFile {
  create: () => RESTPostAPIChatInputApplicationCommandsJSONBody
  invoke: (interaction: ChatInputCommandInteraction) => Promise<void>
}

const HEX_BASE: number = 16
const COLOR_LEN: number = 6
const decimalToHex = (c: Optional<number>): string => (c ? `#${c.toString(HEX_BASE).padStart(COLOR_LEN, "0")}` : "N/A")

const dir: string = "events/commands"

const commands: string[] = (await readdir(dir)).filter(
  (file: string): boolean => file.endsWith(".ts") && !file.startsWith("wish")
)

const getUserId = (): string => fake.helpers.fromRegExp(`[0-9]{${MIN_USER_ID_LEN},${MAX_USER_ID_LEN}}`)

const getUserName = (): string => fake.internet.username()

const getDate = (): dayjs.Dayjs => dayjs(fake.date.past())

beforeAll(async (): Promise<void> => {
  spyOn(console, "info").mockImplementation((): void => undefined) // suppress

  DB.open()

  assert(DB._db)

  await DB._db.delete(birthdays)

  const date: dayjs.Dayjs = getDate()

  // @ts-expect-error: no types
  await DB._db.transaction(async (tx) => {
    await tx.insert(birthdays).values({
      day: date.date(),
      month: date.month() + 1,
      userId: getUserId(),
      userName: getUserName()
    } satisfies IBirthday)
  })
})

afterAll((): void => {
  DB.close()
})

await Promise.all(
  commands.map(async (command: string): Promise<void> => {
    const { create, invoke } = (await import(`${path.join("../..", dir)}/${command}`)) satisfies ICommandFile

    const name: string = path.basename(command, ".ts")

    describe(`/${name}`, (): void => {
      test("create", (): void => {
        const c: RESTPostAPIChatInputApplicationCommandsJSONBody = create()

        expect(c.name).toBe(name)
        expect(c.description).not.toBeEmpty()
        expect(c.contexts ?? []).not.toBeEmpty()
      })

      test("invoke", async (): Promise<void> => {
        type MD = "month" | "day"

        const user: User = {
          displayName: fake.internet.displayName(),
          id: getUserId(),
          username: getUserName()
        } as User

        const interaction: ChatInputCommandInteraction = {
          createdTimestamp: fake.date.past().getTime(),
          deferReply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          user,
          options: {
            getInteger: jest.fn().mockImplementation((s: MD): number => {
              const date: dayjs.Dayjs = getDate()

              return match<MD, number>(s)
                .with("month", (): number => date.month() + 1)
                .with("day", (): number => date.date())
                .exhaustive()
            }),
            getUser: jest.fn().mockReturnValue(user)
          }
        } as unknown as ChatInputCommandInteraction

        expect(await invoke(interaction)).toBeUndefined()

        expect(interaction.deferReply).toHaveBeenCalledTimes(1)
        expect(interaction.editReply).toHaveBeenCalledTimes(1)

        const mockEditReply = interaction.editReply as ReturnType<typeof jest.fn>
        const firstCallArgs = mockEditReply.mock.calls
        const payload = firstCallArgs[0]?.[0]
        if (!payload) {
          throw new Error("Payload not found")
        }

        match<string, void>(name)
          .with("birthday", (): void => expect(payload.content).toInclude("🎂"))
          .with("delete", (): void => expect(payload.content).toInclude("⚠️"))
          .with("info", (): void => {
            const data = payload.embeds?.[0].data

            expect(decimalToHex(data.color)).toBe(env.COLOR)
            expect(data.author.icon_url).toBe(env.LOGO_URL)
            expect(data.author.name).toBe(`${env.NAME} v${version}`)
            expect(data.thumbnail.url).toBe(env.LOGO_URL)
            expect(data.description).not.toBeEmpty()
            expect(data.footer.text).toEndWith(author.name)
          })
          .with(P.union("list", "show"), (): void => {
            const data = payload.embeds?.[0]

            expect(decimalToHex(data.color)).toBe(env.COLOR)
            expect(data.title).toInclude("Birthday")
            expect(data.fields).not.toBeEmpty()
          })
          .with("ping", (): void => expect(payload.content).toInclude("Pong"))
          .otherwise((): never => {
            throw new Error(`Payload tests not found for /${name}`)
          })
      })
    })
  })
)
