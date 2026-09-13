import { parse } from "node:path"

import { checkRate } from "@postfmly/checkrate"
import { error } from "@postfmly/logger"

import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  type HexColorString,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { author, version } from "../../package.json" with { type: "json" }
import { env } from "../../utils/env.ts"

const { COLOR, LOGO_URL, NAME } = env as typeof env

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription(`Information about ${NAME}`)
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  try {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR as HexColorString)
          .setAuthor({ iconURL: LOGO_URL, name: `${NAME} v${version}` })
          .setThumbnail(LOGO_URL)
          .setDescription("- Add birthday role")
          .setFooter({ text: `By ${author.name}` })
      ]
    })
  } catch (e: unknown) {
    const msg: string = `❌ Could not get info for ${NAME}`

    error(msg, e)

    await interaction.editReply({ content: `-# > ${msg}` })
  }
}

export { create, invoke }
