import { parse } from "node:path"

import { error } from "@postfmly/logger"

import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { bucket } from "../../utils/bucket.ts"
import { env } from "../../utils/env.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription(`Ping ${env.NAME}`)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (!bucket.allow(interaction.user.username)) {
    await interaction.editReply({ content: "-# > ❌ Rate limit exceeded" })

    return
  }

  try {
    await interaction.editReply({
      content: `-# > **Pong!** ⚡ Your latency is: \`${Date.now() - interaction.createdTimestamp}ms\``
    })
  } catch (e: unknown) {
    const msg: string = `❌ Could not ping ${env.NAME}`

    error(msg, e)

    await interaction.editReply({ content: `-# > ${msg}` })
  }
}

export { create, invoke }
