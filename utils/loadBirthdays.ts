import {
  type Channel,
  type ChatInputCommandInteraction,
  type Client,
  DiscordAPIError,
  EmbedBuilder,
  type Guild,
  type GuildMember,
  MessageFlags,
  type Role,
  type TextChannel,
  type User
} from "discord.js"

import { error, info } from "@postfmly/logger"

import { default as ordinal } from "ordinal"
import { default as pluralize } from "pluralize"

import { type IBirthday } from "../db/schema.ts"
import { addBirthday as addBirthdayDB, deleteBirthday as deleteBirthdayDB, getBirthdays } from "./db.ts"
import { default as months } from "./months.ts"

let CLIENT: Client | null = null
let CHANNEL: TextChannel | null = null

let BIRTHDAYS: IBirthday[] = []
let COUNT: number = 0

const UNKNOWN_MEMBER: number = 10007

const getChannel = async (): Promise<TextChannel> => {
  if (!CLIENT) {
    throw new Error("Invalid CLIENT")
  }

  const channelId: string = Bun.env.CHANNEL_ID
  if (!channelId) {
    throw new Error("Invalid CHANNEL_ID")
  }

  return await CLIENT.channels.fetch(channelId).then((channel: Channel | null): TextChannel => {
    if (!channel) {
      throw new Error("Invalid channel")
    }

    return channel as TextChannel
  })
}

const refreshBirthdays = async (): Promise<void> => {
  BIRTHDAYS = await getBirthdays()
  COUNT = BIRTHDAYS.length

  if (Bun.env.DEBUG) {
    info(`Loaded ${pluralize("birthday", COUNT, true)}`)
  }
}

const loadSettings = async (client: Client): Promise<void> => {
  CLIENT = client
  CHANNEL = await getChannel()

  await refreshBirthdays()
}

const addBirthday = async (interaction: ChatInputCommandInteraction): Promise<string> => {
  const month: number = interaction.options.getInteger("month") as number
  const day: number = interaction.options.getInteger("day") as number

  const insertOrUpdate: string = await addBirthdayDB(interaction.user.id, month, day).then(
    async (insertOrUpdate: string): Promise<string> => {
      await refreshBirthdays()
      return insertOrUpdate
    }
  )

  if (Bun.env.DEBUG) {
    info(`${insertOrUpdate} birthday of ${months[month]} ${ordinal(day)} for ${interaction.user.displayName}`)
  }

  return insertOrUpdate
}

const deleteBirthday = async (userId: string, name: string | null = null): Promise<void> => {
  await deleteBirthdayDB(userId).then(async (): Promise<void> => await refreshBirthdays())

  if (Bun.env.DEBUG) {
    info(`Deleted birthday for ${name ?? userId}`)
  }
}

const doBirthdays = async (user: User | null = null): Promise<void> => {
  if (!CLIENT) {
    throw new Error("Invalid CLIENT")
  }

  const guildId: string = Bun.env.GUILD_ID
  if (!guildId) {
    throw new Error("Invalid GUILD_ID")
  }

  const guild: Guild = await (CLIENT as Client).guilds.fetch(guildId)

  const roleId: string = Bun.env.ROLE_ID
  if (!roleId) {
    throw new Error("Invalid ROLE_ID")
  }

  const role: Role | null = await guild.roles.fetch(roleId)
  if (!role) {
    throw new Error("Invalid role")
  }

  await Promise.all(
    BIRTHDAYS.map(async (birthday: IBirthday): Promise<void> => {
      const date: Date = new Date()

      let member: GuildMember = {} as GuildMember
      try {
        const userId: string = user?.id ?? birthday.user_id
        member = await guild.members.fetch(userId).catch(async (e: unknown): Promise<never> => {
          if (e instanceof DiscordAPIError && e.code === UNKNOWN_MEMBER) {
            await deleteBirthday(userId)
          }
          throw e
        })
      } catch (e: unknown) {
        error(e)
        return
      }

      if (user || (birthday.month === date.getMonth() + 1 && birthday.day === date.getDate())) {
        if (!member.roles.cache.has(role.id)) {
          await member.roles.add(role).then(async (): Promise<void> => {
            await CHANNEL?.send({
              flags: MessageFlags.SuppressNotifications,
              embeds: [
                new EmbedBuilder()
                  .setColor("#78866b")
                  .setAuthor({
                    iconURL: Bun.env.LOGO_URL,
                    name: `${Bun.env.NAME} v${Bun.env.npm_package_version}`
                  })
                  .setImage(Bun.env.LOGO2_URL)
                  .setTitle("🎂  HAPPY BIRTHDAY  🎉")
                  .setFooter({
                    iconURL: member.displayAvatarURL(),
                    text: member.displayName
                  })
              ]
            })
          })

          if (Bun.env.DEBUG) {
            info(`Added Birthday role to ${member.displayName}`)
          }
        }
      } else {
        await member.roles.remove(role)

        if (Bun.env.DEBUG) {
          info(`Removed Birthday role from ${member.displayName}`)
        }
      }
    })
  )
}

const handleBirthdays = async (): Promise<void> => {
  process.on("unhandledRejection", (e: unknown) => error(e))

  Bun.cron("@midnight", async (): Promise<void> => await doBirthdays())
}

export { addBirthday, BIRTHDAYS, COUNT, deleteBirthday, doBirthdays, handleBirthdays, loadSettings, refreshBirthdays }
