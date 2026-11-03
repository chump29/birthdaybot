import { parse } from "node:path"

import { default as dayjs } from "dayjs"
import { default as advancedFormat } from "dayjs/plugin/advancedFormat"
import { default as customParseFormat } from "dayjs/plugin/customParseFormat"
import {
  type APIEmbedField,
  type ChatInputCommandInteraction,
  EmbedBuilder,
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

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("List all birthdays")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const getFields = (birthdays: IBirthday[]): APIEmbedField[] => {
  const fields: APIEmbedField[] = [{ name: "_ _", value: "" } satisfies APIEmbedField]

  if (birthdays.length > 0) {
    const sortedBirthdays = birthdays.toSorted(
      (a: IBirthday, b: IBirthday): number => a.month - b.month || a.day - b.day
    )

    for (const birthday of sortedBirthdays) {
      const date = `${birthday.month}/${birthday.day}`

      fields.push({
        inline: true,
        name: birthday.userName,
        value: `${dayjs(date, "M/D").format("MMMM Do")}`
      } satisfies APIEmbedField)
    }
  } else {
    fields.push({
      name: "🚫  Nothing to show",
      value: ""
    } satisfies APIEmbedField)
  }

  return fields
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(env.COLOR)
        .setTitle(`🎂  ${env.NAME} Birthdays  🎉`)
        .setFields(getFields(await DB.getBirthdays()))
        .toJSON()
    ]
  })
}

export { create, invoke }
