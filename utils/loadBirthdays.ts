import { default as process } from "node:process"

import { error, info } from "@postfmly/logger"
import { type Nullable, type Optional } from "@postfmly/types"

import {
  type Channel,
  ChannelType,
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder,
  type Guild,
  type GuildMember,
  type HexColorString,
  type Message,
  MessageFlags,
  type Role,
  type TextChannel,
  type User,
  userMention
} from "discord.js"

import { type IBirthday } from "../db/schema.ts"
import { version } from "../package.json" with { type: "json" }
import { DB } from "./db.ts"
import { env } from "./env.ts"

const { CHANNEL_ID, COLOR, DEBUG, GUILD_ID, LOGO_URL, LOGO2_URL, NAME, ROLE_ID } = env as typeof env

interface ITaskData {
  member: Optional<GuildMember>
  success: boolean
  userId: Optional<string>
}

let CLIENT: Nullable<Client> = null
let CHANNEL: Nullable<TextChannel> = null
let GUILD: Nullable<Guild> = null
let ROLE: Nullable<Role> = null

const getChannel = async (client: Client): Promise<void> => {
  CLIENT = client

  const channel: Nullable<Channel> = await CLIENT.channels.fetch(CHANNEL_ID)
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error("Invalid channel")
  }

  CHANNEL = channel as TextChannel
}

const getGuild = async (): Promise<Guild> => {
  if (!CLIENT) {
    throw new Error("Invalid CLIENT")
  }

  const guild: Guild = await CLIENT.guilds.fetch(GUILD_ID)

  GUILD = guild

  return guild
}

const getRole = async (): Promise<void> => {
  const role: Nullable<Role> = (await GUILD?.roles.fetch(ROLE_ID)) ?? null
  if (!role) {
    throw new Error("Role not found")
  }

  ROLE = role
}

const initBirthdays = async (client: Client): Promise<void> => {
  await getChannel(client)

  const guild: Guild = await getGuild()

  await guild.members.fetch()

  await getRole()

  process.on("unhandledRejection", (e) => error(e))

  Bun.cron("@midnight", async (): Promise<void> => {
    try {
      if (DEBUG) {
        info("🛈  Handling birthdays...")
      }

      await handleBirthdays()
    } catch (e: unknown) {
      error(e)
    }
  })

  if (DEBUG) {
    info("🔨 Settings loaded")
  }
}

const handleErrors = (results: PromiseSettledResult<unknown>[]): void => {
  for (const result of results) {
    if (result.status === "rejected") {
      error(`Error: ${result.reason}`)
    }
  }
}

const handleBirthdays = async (i: Nullable<ChatInputCommandInteraction> = null): Promise<void> => {
  if (!ROLE) {
    throw new Error("Invalid ROLE")
  }

  const role_: Role = ROLE // scope

  if (!GUILD) {
    throw new Error("Invalid GUILD")
  }

  const guild_: Guild = GUILD // scope

  let birthdays: IBirthday[]
  if (i) {
    const u: Nullable<User> = i.options.getUser("user")
    if (!u) {
      throw new Error("Invalid user")
    }

    const m: Optional<GuildMember> = guild_.members.cache.find(
      (member: GuildMember): boolean => member.user.displayName.toLowerCase() === u.displayName.toLowerCase()
    )
    if (!m) {
      await i.editReply({ content: "-# > ❌ Member not found" })

      return
    }

    const date: Date = new Date()

    birthdays = [
      { day: date.getDate(), month: date.getMonth() + 1, userId: m.id, userName: m.displayName } as IBirthday
    ] as IBirthday[]

    await i.editReply({ content: `Wishing \`${m.displayName}\` a Happy Birthday and added Birthday role` })
  } else {
    birthdays = await DB.getBirthdaysToday()

    if (birthdays.length === 0) {
      if (DEBUG) {
        const date: string = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit" }).format(new Date())
        info(`🛈  No birthdays found for ${date}`)
      }

      return
    }
  }

  const isBirthday: GuildMember[] = []
  const toAddRole: GuildMember[] = []
  const toRemoveRole: GuildMember[] = []
  const toDelete: string[] = []

  const memberTasks: Promise<ITaskData>[] = birthdays.map(async (birthday: IBirthday): Promise<ITaskData> => {
    const userId: string = birthday.userId

    let member: Nullable<GuildMember> = guild_.members.cache.get(userId) ?? null

    if (!member) {
      try {
        member = await guild_.members.fetch(userId)
      } catch {
        return { userId, success: false } as ITaskData
      }
    }

    return { member, success: true } as ITaskData
  })

  const taskResults: ITaskData[] = await Promise.all(memberTasks)

  for (const data of taskResults) {
    if (data.success && data.member) {
      isBirthday.push(data.member)

      if (!data.member.roles.cache.has(role_.id)) {
        if (data.member.user.id === guild_.ownerId) {
          info("🛈  Not altering server owner roles")
        } else {
          toAddRole.push(data.member)
        }
      }
    } else if (!data.success && data.userId) {
      toDelete.push(data.userId)
    }
  }

  const birthdayIds: Set<string> = new Set(isBirthday.map((member: GuildMember): string => member.id))

  for (const member of ROLE.members.values()) {
    if (!birthdayIds.has(member.id)) {
      if (member.user.id === guild_.ownerId) {
        info("🛈  Not altering server owner roles")
      } else {
        toRemoveRole.push(member)
      }
    }
  }

  for (const [k, v] of Object.entries({ isBirthday, toAddRole, toDelete, toRemoveRole })) {
    if (v.length > 0) {
      info(`🛈  ${k}: ${v.length}`)
    }
  }

  if (!CHANNEL) {
    throw new Error("Invalid CHANNEL")
  }

  const channel_: TextChannel = CHANNEL // scope

  await Promise.allSettled([
    ...isBirthday.map((member: GuildMember): Promise<Message<true>> => {
      if (DEBUG) {
        info(`🛈  Wishing ${member.displayName} a Happy Birthday`)
      }

      return channel_.send({
        content: userMention(member.id),
        flags: MessageFlags.SuppressNotifications,
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR as HexColorString)
            .setAuthor({
              iconURL: LOGO_URL,
              name: `${NAME} v${version}`
            })
            .setImage(LOGO2_URL)
            .setTitle("🎂  HAPPY BIRTHDAY  🎉")
            .setFooter({
              iconURL: member.displayAvatarURL(),
              text: member.displayName
            })
        ]
      })
    }),
    ...toAddRole.map((member: GuildMember): Promise<GuildMember> => {
      if (DEBUG) {
        info(`🛈  Added Birthday role to ${member.displayName}`)
      }

      return member.roles.add(role_)
    }),
    ...toRemoveRole.map((member: GuildMember): Promise<GuildMember> => {
      if (DEBUG) {
        info(`🛈  Removed Birthday role from ${member.displayName}`)
      }

      return member.roles.remove(role_)
    }),
    ...toDelete.map((userId: string): Promise<void> => {
      if (DEBUG) {
        info(`🛈  Deleted ${userId}`)
      }

      return DB.deleteBirthday(userId)
    })
  ]).then((results): void => handleErrors(results))
}

export { handleBirthdays, initBirthdays }
