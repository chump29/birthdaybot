import { error, info } from "@postfmly/logger"
import { type Nullable, type Optional } from "@postfmly/types"

import { default as dayjs } from "dayjs"
import { default as advancedFormat } from "dayjs/plugin/advancedFormat"
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
import { DB } from "./db.ts"
import { env } from "./env.ts"

dayjs.extend(advancedFormat)

const WRONG: string = "-# > ❌ Something went wrong"

interface ITaskData {
  member?: GuildMember
  success: boolean
  userId?: string
}

interface IBirthdayBot {
  handleBirthdays: (interaction?: ChatInputCommandInteraction) => Promise<void>
  init: (client: Client) => Promise<void>
}

class BirthdayBot implements IBirthdayBot {
  private CHANNEL: Nullable<TextChannel> = null
  private GUILD: Nullable<Guild> = null
  private ROLE: Nullable<Role> = null

  // * /wish
  async handleBirthdays(interaction?: ChatInputCommandInteraction): Promise<void> {
    if (!this.ROLE) {
      throw new Error("Invalid ROLE")
    }
    const role: Role = this.ROLE // narrow

    if (!this.GUILD) {
      throw new Error("Invalid GUILD")
    }
    const guild: Guild = this.GUILD // narrow

    let birthdays: IBirthday[]

    const date: dayjs.Dayjs = dayjs()

    if (interaction) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral })

      const u: Nullable<User> = interaction.options.getUser("user")
      if (!u) {
        interaction.editReply({ content: WRONG })

        error("❌ User not found")

        return
      }

      const m: Optional<GuildMember> = guild.members.cache.find(
        (member: GuildMember): boolean => member.user.displayName.toLowerCase() === u.displayName.toLowerCase()
      )
      if (!m) {
        await interaction.editReply({ content: WRONG })

        error("❌ Member not found")

        return
      }

      birthdays = [
        { day: date.date(), month: date.month() + 1, userId: m.id, userName: m.displayName } as IBirthday
      ] as IBirthday[]

      await interaction.editReply({ content: `-# > 🎉 Wished \`${interaction.user.username}\` a Happy Birthday` })
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

    const memberTasks: Promise<ITaskData>[] = birthdays.map(async (birthday: IBirthday): Promise<ITaskData> => {
      const userId: string = birthday.userId

      let member: Nullable<GuildMember> = guild.members.cache.get(userId) ?? null

      if (!member) {
        try {
          member = await guild.members.fetch(userId)
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

        if (!data.member.roles.cache.has(role.id)) {
          if (data.member.user.id === guild.ownerId) {
            info(`🛈  Not altering server owner roles for ${data.member.user.username}`)
          } else {
            toAddRole.push(data.member)
          }
        }
      } else if (!data.success && data.userId) {
        toDelete.push(data.userId)
      }
    }

    const birthdayIds: Set<string> = new Set(isBirthday.map((member: GuildMember): string => member.id))

    for (const member of role.members.values()) {
      if (!birthdayIds.has(member.id)) {
        if (member.user.id === guild.ownerId) {
          if (env.DEBUG) {
            info(`🛈  Not altering server owner roles for ${member.user.username}`)
          }
        } else {
          toRemoveRole.push(member)
        }
      }
    }

    if (env.DEBUG) {
      for (const [k, v] of Object.entries({ isBirthday, toAddRole, toDelete, toRemoveRole })) {
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
          flags: MessageFlags.SuppressNotifications,
          embeds: [
            new EmbedBuilder()
              .setColor(env.COLOR as HexColorString)
              .setImage(env.LOGO2_URL)
              .setTitle("🎂  HAPPY BIRTHDAY  🎉")
              .setFooter({
                iconURL: member.displayAvatarURL(),
                text: member.displayName
              })
          ]
        })
      }),
      ...toAddRole.map((member: GuildMember): Promise<GuildMember> => {
        if (env.DEBUG) {
          info(`🛈  Added Birthday role to ${member.displayName}`)
        }

        return member.roles.add(role)
      }),
      ...toRemoveRole.map((member: GuildMember): Promise<GuildMember> => {
        if (env.DEBUG) {
          info(`🛈  Removed Birthday role from ${member.displayName}`)
        }

        return member.roles.remove(role)
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
    const channel: Nullable<Channel> = await client.channels.fetch(env.CHANNEL_ID)
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error("Invalid channel")
    }

    this.CHANNEL = channel as TextChannel

    this.GUILD = await client.guilds.fetch(env.GUILD_ID)

    const role: Nullable<Role> = await this.GUILD.roles.fetch(env.ROLE_ID)
    if (!role) {
      throw new Error("Role not found")
    }

    this.ROLE = role

    Bun.cron("@midnight", (): Promise<void> => this.handleBirthdays())
  }
}

const Birthday: IBirthdayBot = new BirthdayBot()

export { Birthday }
