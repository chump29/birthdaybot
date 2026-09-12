import { parse } from "node:path"

import { checkRate } from "@postfmly/checkrate"
import { error } from "@postfmly/logger"

import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { DB } from "../../utils/db.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("Delete birthday")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  const userId: string = interaction.user.id

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  try {
    if (!(await DB.isValidUser(userId))) {
      await interaction.editReply({ content: "-# > ⚠️  Birthday not found" })

      return
    }

    await DB.deleteBirthday(userId)

    await interaction.editReply({ content: "-# > ✅ Deleted birthday" })
  } catch (e) {
    error(`❌ Could not delete birthday for ${interaction.user.displayName} (${userId})`, e)

    await interaction.editReply({ content: "-# > ❌ Could not delete birthday" })
  }
}

export { create, invoke }
