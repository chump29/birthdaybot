import { parse } from "node:path"

import { type Optional } from "@postfmly/types"

import { default as dayjs } from "dayjs"
import { default as advancedFormat } from "dayjs/plugin/advancedFormat"
import { default as customParseFormat } from "dayjs/plugin/customParseFormat"
import {
  type APIEmbedField,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { type IBirthday } from "../../db/schema.ts"
import { bucket } from "../../utils/bucket.ts"
import { DB } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"

dayjs.extend(advancedFormat)
dayjs.extend(customParseFormat)

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("Show birthday")
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const getFields = (birthday: Optional<IBirthday>): APIEmbedField[] => {
  const fields: APIEmbedField[] = [{ name: "_ _", value: "" } satisfies APIEmbedField]

  if (birthday) {
    const date = `${birthday.month}/${birthday.day}`

    fields.push({
      inline: true,
      name: `${dayjs(date, "M/D").format("MMMM Do")}`,
      value: ""
    } satisfies APIEmbedField)
  } else {
    fields.push({
      name: "🚫  Birthday not set",
      value: ""
    } satisfies APIEmbedField)
  }

  return fields
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (!bucket.allow(interaction.user.username)) {
    await interaction.editReply({ content: "-# > ❌ Rate limit exceeded" })

    return
  }

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(env.COLOR)
        .setTitle(`🎂  ${interaction.user.displayName}'s Birthday  🎉`)
        .setFields(getFields(await DB.getBirthday(interaction.user.id)))
        .toJSON()
    ]
  })
}

export { create, invoke }
