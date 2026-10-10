import { parse } from "node:path"

import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { bucket } from "../../utils/bucket.ts"
import { DB } from "../../utils/db.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("Delete birthday")
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (!bucket.allow(interaction.user.username)) {
    await interaction.editReply({ content: "-# > ❌ Rate limit exceeded" })

    return
  }

  const userId: string = interaction.user.id

  if (!(await DB.isValidUser(userId))) {
    await interaction.editReply({ content: "-# > ⚠️  Birthday not found" })

    return
  }

  await DB.deleteBirthday(userId)

  await interaction.editReply({ content: "-# > ✅ Deleted birthday" })
}

export { create, invoke }
