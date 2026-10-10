import { parse } from "node:path"

import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  type SlashCommandUserOption
} from "discord.js"

import { Birthday } from "../../utils/birthday.ts"

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
  await Birthday.handleBirthdays(interaction)
}

export { create, invoke }
