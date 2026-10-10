import { parse } from "node:path"

import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  type HexColorString,
  InteractionContextType,
  MessageFlags,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { author, version } from "../../package.json" with { type: "json" }
import { bucket } from "../../utils/bucket.ts"
import { env } from "../../utils/env.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription(`Information about ${env.NAME}`)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (!bucket.allow(interaction.user.username)) {
    await interaction.editReply({ content: "-# > ❌ Rate limit exceeded" })

    return
  }

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(env.COLOR as HexColorString)
        .setAuthor({ iconURL: env.LOGO_URL, name: `${env.NAME} v${version}` })
        .setThumbnail(env.LOGO_URL)
        .setDescription("- Add birthday role")
        .setFooter({ text: `By ${author.name}` })
    ]
  })
}

export { create, invoke }
