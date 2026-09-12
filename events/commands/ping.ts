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

import { env } from "../../utils/env.ts"

const { NAME }: typeof env = env

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription(`Ping ${NAME}`)
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
      content: `-# > **Pong!** ⚡ Your latency is: \`${Date.now() - interaction.createdTimestamp}ms\``
    })
  } catch (e: unknown) {
    const msg: string = `❌ Could not ping ${NAME}`

    error(msg, e)

    await interaction.editReply({ content: `-# > ${msg}` })
  }
}

export { create, invoke }
