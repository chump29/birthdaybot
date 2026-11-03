import { error, info } from "@postfmly/logger"

import { default as dayjs } from "dayjs"
import { default as advancedFormat } from "dayjs/plugin/advancedFormat"
import {
  ChannelType,
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder,
  type Guild,
  type GuildMember,
  type Message,
  MessageFlags,
  type Role,
  type TextChannel,
  userMention
} from "discord.js"

import { type IBirthday } from "../db/schema.ts"
import { DB } from "./db.ts"
import { env } from "./env.ts"

dayjs.extend(advancedFormat)

interface ITaskData {
  readonly member?: GuildMember
  readonly success: boolean
  readonly userId?: string
}

interface IBirthdayBot {
  handleBirthdays: (interaction?: ChatInputCommandInteraction) => Promise<void>
  init: (client: Client) => Promise<void>
}

class BirthdayBot implements IBirthdayBot {
  private CHANNEL!: TextChannel

  private GUILD!: Guild
  private ROLE!: Role

  // * /wish
  async handleBirthdays(interaction?: ChatInputCommandInteraction): Promise<void> {
    let birthdays: IBirthday[]

    const date = dayjs()

    if (interaction) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral })

      // biome-ignore lint/style/noNonNullAssertion: required
      const user = interaction.options.getUser("user")!

      birthdays = [
        { day: date.date(), month: date.month() + 1, userId: user.id, userName: user.displayName }
      ] satisfies IBirthday[]

      await interaction.editReply({ content: `-# > 🎉 Wished \`${user.displayName}\` a Happy Birthday` })
    } else {
      birthdays = await DB.getBirthdaysToday()
      if (birthdays.length === 0) {
        if (env.DEBUG) {
          info(`🛈  No birthdays found for ${date.format("MMMM Do")}`)
        }

        return
      }
    }

    const isBirthday: GuildMember[] = []
    const toAddRole: GuildMember[] = []
    const toRemoveRole: GuildMember[] = []
    const toDelete: string[] = []

    const memberTasks = birthdays.map(async (birthday: IBirthday): Promise<ITaskData> => {
      const { userId } = birthday

      let member = this.GUILD.members.cache.get(userId) ?? null
      if (!member) {
        try {
          member = await this.GUILD.members.fetch(userId)
        } catch {
          return { userId, success: false } satisfies ITaskData
        }
      }

      return { member, success: true } satisfies ITaskData
    })

    const taskResults = await Promise.all(memberTasks)

    for (const data of taskResults) {
      if (data.success && data.member) {
        isBirthday.push(data.member)

        if (!data.member.roles.cache.has(this.ROLE.id)) {
          if (data.member.user.id === this.GUILD.ownerId) {
            info(`🛈  Not altering server owner roles for ${data.member.user.username}`)
          } else {
            toAddRole.push(data.member)
          }
        }
      } else if (!data.success && data.userId) {
        toDelete.push(data.userId)
      }
    }

    const birthdayIds = new Set(isBirthday.map((member: GuildMember): string => member.id))

    for (const member of this.ROLE.members.values()) {
      if (!birthdayIds.has(member.id)) {
        if (member.user.id === this.GUILD.ownerId) {
          if (env.DEBUG) {
            info(`🛈  Not altering server owner roles for ${member.user.username}`)
          }
        } else {
          toRemoveRole.push(member)
        }
      }
    }

    if (env.DEBUG) {
      const entries = Object.entries({ isBirthday, toAddRole, toDelete, toRemoveRole })

      for (const [k, v] of entries) {
        if (v.length > 0) {
          info(`🛈  ${k}: ${v.length}`)
        }
      }
    }

    const results = await Promise.allSettled([
      ...isBirthday.map((member: GuildMember): Promise<Message<true>> => {
        if (env.DEBUG) {
          info(`🛈  Wishing ${member.displayName} a Happy Birthday`)
        }

        if (!this.CHANNEL) {
          throw new Error("Invalid CHANNEL")
        }

        return this.CHANNEL.send({
          content: userMention(member.id),
          embeds: [new EmbedBuilder().setColor(env.COLOR).setTitle("🎂  HAPPY BIRTHDAY  🎉")],
          flags: MessageFlags.SuppressNotifications
        })
      }),
      ...toAddRole.map((member: GuildMember): Promise<GuildMember> => {
        if (env.DEBUG) {
          info(`🛈  Added Birthday role to ${member.displayName}`)
        }

        return member.roles.add(this.ROLE)
      }),
      ...toRemoveRole.map((member: GuildMember): Promise<GuildMember> => {
        if (env.DEBUG) {
          info(`🛈  Removed Birthday role from ${member.displayName}`)
        }

        return member.roles.remove(this.ROLE)
      }),
      ...toDelete.map((userId: string): Promise<void> => {
        if (env.DEBUG) {
          info(`🛈  Deleted ${userId}`)
        }

        return DB.deleteBirthday(userId)
      })
    ])

    if (env.DEBUG) {
      for (const result of results) {
        if (result.status === "rejected") {
          error(`❌ Error: ${result.reason}`)
        }
      }
    }
  }

  async init(client: Client): Promise<void> {
    const channel = await client.channels.fetch(env.CHANNEL_ID)
    if (channel?.type !== ChannelType.GuildText) {
      throw new Error("Invalid channel")
    }

    this.CHANNEL = channel

    this.GUILD = await client.guilds.fetch(env.GUILD_ID)

    const role = await this.GUILD.roles.fetch(env.ROLE_ID)
    if (!role) {
      throw new Error("Role not found")
    }

    this.ROLE = role

    Bun.cron("@midnight", (): Promise<void> => this.handleBirthdays())
  }
}

export const Birthday = new BirthdayBot()
