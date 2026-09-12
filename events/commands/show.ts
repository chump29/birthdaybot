import { parse } from "node:path"

import { checkRate } from "@postfmly/checkrate"
import { error } from "@postfmly/logger"
import { type Optional } from "@postfmly/types"

import { default as dayjs } from "dayjs"
import { default as advancedFormat } from "dayjs/plugin/advancedFormat"
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

const { COLOR }: typeof env = env

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("Show birthday")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const getFields = (birthday: Optional<IBirthday>): APIEmbedField[] => {
  const fields: APIEmbedField[] = [{ name: "_ _", value: "" } as APIEmbedField]

  if (birthday) {
    const date: string = `${birthday.month}/${birthday.day}`

    fields.push({
      inline: true,
      name: `${dayjs(date, "M/D").format("MMMM Do")}`,
      value: ""
    } as APIEmbedField)
  } else {
    fields.push({
      name: "🚫  Birthday not set",
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
    const birthday: Optional<IBirthday> = await DB.getBirthday(interaction.user.id)

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR as HexColorString)
          .setTitle(`🎂  ${interaction.user.displayName}'s Birthday  🎉`)
          .setFields(getFields(birthday))
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
