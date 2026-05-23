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

import { COUNT } from "../../utils/loadBirthdays.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody => {
  return new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription(`Information about ${Bun.env.NAME}`)
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  if (!Bun.env.LOGO_URL) {
    throw new Error("Invalid LOGO_URL")
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    embeds: [
      new EmbedBuilder()
        .setColor("#78866b")
        .setAuthor({
          iconURL: Bun.env.LOGO_URL,
          name: `${Bun.env.NAME} v${Bun.env.npm_package_version}`
        })
        .setThumbnail(Bun.env.LOGO_URL)
        .setDescription("- Add birthday role")
        .setFields({
          inline: true,
          name: "Total Birthdays",
          value: COUNT.toLocaleString()
        } as APIEmbedField)
        .setFooter({
          text: "By Chris Post"
        })
    ]
  })
}

export { create, invoke }
