import { parse } from "node:path"

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

import { checkRate } from "@postfmly/checkrate"
import { info } from "@postfmly/logger"

import { type IBirthday } from "../../db/schema.ts"
import { BIRTHDAYS } from "../../utils/loadBirthdays.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody => {
  return new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("List birthdays")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()
}

const getFields = async (): Promise<APIEmbedField[]> => {
  const fields: APIEmbedField[] = [
    {
      name: "_ _",
      value: ""
    } as APIEmbedField
  ]
  if (!BIRTHDAYS.length) {
    fields.push({
      name: "🚫  Nothing to show",
      value: ""
    } as APIEmbedField)
  } else {
    BIRTHDAYS.toSorted((a: IBirthday, b: IBirthday): number => a.month - b.month || a.day - b.day).forEach(
      (birthday: IBirthday): void => {
        fields.push({
          inline: true,
          name: birthday.user_name,
          value: `${birthday.month}/${birthday.day}`
        } as APIEmbedField)
      }
    )
  }
  return fields
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    embeds: [
      new EmbedBuilder()
        .setColor("#78866b")
        .setTitle(`🎂  ${Bun.env.NAME} Birthdays  🎉`)
        .setFields(await getFields())
        .toJSON()
    ]
  })

  if (Bun.env.DEBUG) {
    info("Listed birthdays")
  }
}

export { create, invoke }
