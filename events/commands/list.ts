import { parse } from "node:path"

import { checkRate } from "@postfmly/checkrate"
import { error } from "@postfmly/logger"

import { default as dayjs } from "dayjs"
import { default as advancedFormat } from "dayjs/plugin/advancedFormat"
import { default as customParseFormat } from "dayjs/plugin/customParseFormat"
import {
  type APIEmbedField,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  type HexColorString,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { type IBirthday } from "../../db/schema.ts"
import { DB } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"

dayjs.extend(advancedFormat)
dayjs.extend(customParseFormat)

const { COLOR, NAME } = env as typeof env

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("List all birthdays")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const getFields = (birthdays: IBirthday[]): APIEmbedField[] => {
  const fields: APIEmbedField[] = [{ name: "_ _", value: "" } as APIEmbedField]

  if (birthdays.length > 0) {
    for (const birthday of birthdays.toSorted(
      (a: IBirthday, b: IBirthday): number => a.month - b.month || a.day - b.day
    )) {
      const date: string = `${birthday.month}/${birthday.day}`

      fields.push({
        inline: true,
        name: birthday.userName,
        value: `${dayjs(date, "M/D").format("MMMM Do")}`
      } as APIEmbedField)
    }
  } else {
    fields.push({
      name: "🚫  Nothing to show",
      value: ""
    } as APIEmbedField)
  }

  return fields
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  try {
    const birthdays: IBirthday[] = await DB.getBirthdays()

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR as HexColorString)
          .setTitle(`🎂  ${NAME} Birthdays  🎉`)
          .setFields(getFields(birthdays))
          .toJSON()
      ]
    })
  } catch (e: unknown) {
    const msg: string = "❌ Could not list birthdays"

    error(msg, e)

    await interaction.editReply({ content: `-# > ${msg}` })
  }
}

export { create, invoke }
