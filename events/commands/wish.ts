import { parse } from "node:path"

import { error } from "@postfmly/logger"

import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  type SlashCommandUserOption
} from "discord.js"

import { handleBirthdays } from "../../utils/loadBirthdays.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("Wish a Happy Birthday")
    .addUserOption(
      (option: SlashCommandUserOption): SlashCommandUserOption =>
        option.setName("user").setDescription("User").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  try {
    await handleBirthdays(interaction)
  } catch (e: unknown) {
    const msg: string = "❌ Could not wish birthday"

    error(msg, e)

    await interaction.editReply({ content: `-# > ${msg}` })
  }
}

export { create, invoke }
