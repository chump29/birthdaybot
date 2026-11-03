import { default as assert } from "node:assert/strict"
import { readdir } from "node:fs/promises"
import { default as path } from "node:path"

import { afterAll, beforeAll, describe, expect, mock, spyOn, test } from "bun:test"

import { type Optional } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"
import { default as dayjs } from "dayjs"
import {
  type APIEmbed,
  type Channel,
  ChannelType,
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder,
  type Guild,
  type Role,
  type TextChannel,
  type User
} from "discord.js"
import { match, P } from "ts-pattern"

import { birthdays, type IBirthday, MAX_ID_LEN, MIN_ID_LEN } from "../../db/schema.ts"
import { type ICreate } from "../../events/clientReady.ts"
import { type IInvoke } from "../../events/interactionCreate.ts"
import { author, version } from "../../package.json" with { type: "json" }
import { Birthday } from "../../utils/birthday.ts"
import { DB } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"

if (!env.TEST_FULL) {
  spyOn(console, "info").mockImplementation((): void => undefined)
}

const HEX_BASE = 16
const COLOR_LEN = 6
const decimalToHex = (c: Optional<number>): string => (c ? `#${c.toString(HEX_BASE).padStart(COLOR_LEN, "0")}` : "N/A")

const dir = "events/commands"

const commands = (await readdir(dir)).filter(
  (file: string): boolean => file.endsWith(".ts") && !file.startsWith("wish")
)

const getUserId = (): string => fake.helpers.fromRegExp(`[0-9]{${MIN_ID_LEN},${MAX_ID_LEN}}`)

const getUserName = (): string => fake.internet.username()

const getDate = (): dayjs.Dayjs => dayjs(fake.date.past())

beforeAll(async (): Promise<void> => {
  DB.open()

  assert(DB.instance)

  await DB.instance.delete(birthdays)

  const date = getDate()

  DB.instance.insert(birthdays).values({
    day: date.date(),
    month: date.month() + 1,
    userId: getUserId(),
    userName: getUserName()
  } satisfies IBirthday)

  const mockSend = mock<TextChannel["send"]>()

  await Birthday.init(
    createMock<Client>({
      channels: {
        fetch: createMock<Channel>({
          send: mockSend,
          type: ChannelType.GuildText
        })
      },
      guilds: {
        fetch: createMock<Guild>({
          roles: {
            fetch: createMock<Role>()
          }
        })
      }
    })
  )
})

afterAll((): void => {
  DB.close()
})

await Promise.all(
  commands.map(async (command: string): Promise<void> => {
    const file: ICreate & IInvoke = await import(`${path.join("../..", dir)}/${command}`)

    const name = path.basename(command, ".ts")

    describe(`/${name}`, (): void => {
      test("create", (): void => {
        const c = file.create()

        expect(c.name).toBe(name)
        expect(c.description).not.toBeEmpty()
        expect(c.contexts ?? []).not.toBeEmpty()
      })

      test("invoke", async (): Promise<void> => {
        type MD = "month" | "day"

        const [mockDeferReply, mockEditReply] = [
          mock<ChatInputCommandInteraction["deferReply"]>(),
          mock<ChatInputCommandInteraction["editReply"]>()
        ]

        const user = createMock<User>({
          displayName: fake.internet.displayName(),
          id: getUserId(),
          username: getUserName()
        })

        expect(
          await file.invoke(
            createMock<ChatInputCommandInteraction>({
              createdTimestamp: fake.date.past().getTime(),
              deferReply: mockDeferReply,
              editReply: mockEditReply,
              options: {
                getInteger: mock<(s: MD) => number>().mockImplementation((s: MD): number => {
                  const date = getDate()

                  return match<MD, number>(s)
                    .with("month", (): number => date.month() + 1)
                    .with("day", (): number => date.date())
                    .exhaustive()
                }),
                getUser: mock<() => User>().mockReturnValue(user)
              },
              user
            })
          )
        ).toBeUndefined()

        expect(mockDeferReply).toHaveBeenCalledOnce()
        expect(mockEditReply).toHaveBeenCalledOnce()

        const payload = mockEditReply.mock.calls[0]?.[0]
        if (!payload || typeof payload !== "object") {
          throw new Error("Payload not found")
        }

        const isEmbed = (e: unknown): e is APIEmbed => typeof e === "object" && e !== null && !Array.isArray(e)

        let data: APIEmbed
        if ("embeds" in payload && Array.isArray(payload.embeds)) {
          const [firstEmbed] = payload.embeds
          if (!isEmbed(firstEmbed)) {
            throw new Error("Embed not found")
          }

          ;({ data } = EmbedBuilder.from(firstEmbed))
        }

        let content = ""
        if ("content" in payload && typeof payload.content === "string") {
          ;({ content } = payload)
        }

        match<string, void>(name)
          .with("birthday", (): void => expect(content).toInclude("🎂"))
          .with("delete", (): void => expect(content).toInclude("⚠️"))
          .with("info", (): void => {
            expect(decimalToHex(data.color)).toBe(env.COLOR)
            expect(data.author?.icon_url).toBe(env.LOGO_URL)
            expect(data.author?.name).toBe(`${env.NAME} v${version}`)
            expect(data.thumbnail?.url).toBe(env.LOGO_URL)
            expect(data.description).not.toBeEmpty()
            expect(data.footer?.text).toEndWith(author.name)
          })
          .with(P.union("list", "show"), (): void => {
            expect(decimalToHex(data.color)).toBe(env.COLOR)
            expect(data.title).toInclude("Birthday")
            expect(data.fields).not.toBeEmpty()
          })
          .with("ping", (): void => expect(content).toInclude("Pong"))
          .otherwise((): never => {
            throw new Error(`Payload tests not found for /${name}`)
          })
      })
    })
  })
)
