import { parse } from "node:path"

import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  type SlashCommandIntegerOption
} from "discord.js"

import { checkRate } from "@postfmly/checkrate"

import { default as ordinal } from "ordinal"

import { MAX_DAYS, MAX_MONTHS, MIN_DAYS, MIN_MONTHS } from "../../utils/db.ts"
import { addBirthday } from "../../utils/loadBirthdays.ts"
import { default as months } from "../../utils/months.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody => {
  return new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("Add birthday")
    .addIntegerOption(
      (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
        option
          .setName("month")
          .setDescription("Month")
          .setMinValue(MIN_MONTHS)
          .setMaxValue(MAX_MONTHS)
          .setRequired(true)
    )
    .addIntegerOption(
      (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
        option.setName("day").setDescription("Day").setMinValue(MIN_DAYS).setMaxValue(MAX_DAYS).setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  await addBirthday(interaction).then(async (insertOrUpdate: string): Promise<void> => {
    const month: number = interaction.options.getInteger("month") as number
    const day: number = interaction.options.getInteger("day") as number

    await interaction.reply({
      content: `-# > 🎂  ${insertOrUpdate} birthday as \`${months[month]} ${ordinal(day)}\`  🎉`,
      flags: MessageFlags.Ephemeral
    })
  })
}

export { create, invoke }
