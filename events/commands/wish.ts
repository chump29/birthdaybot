import { parse } from "node:path"

import {
  type ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  type SlashCommandUserOption,
  type User
} from "discord.js"

import { doBirthdays } from "../../utils/loadBirthdays.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody => {
  return new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("Wish a Happy Birthday")
    .addUserOption(
      (option: SlashCommandUserOption): SlashCommandUserOption =>
        option.setName("user").setDescription("User").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON()
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const user: User | null = interaction.options.getUser("user")
  if (!user) {
    throw new Error("Invalid user")
  }

  if (!interaction.channel || !interaction.guild) {
    throw new Error("Invalid channel/guild")
  }

  await doBirthdays(user).then(async (): Promise<void> => {
    await interaction.reply({
      content: `Wished \`${user.displayName}\` a Happy Birthday and added Birthday role`,
      flags: MessageFlags.Ephemeral
    })
  })
}

export { create, invoke }
