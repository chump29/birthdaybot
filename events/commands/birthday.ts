import { parse } from "node:path"

import { checkRate } from "@postfmly/checkrate"
import { error } from "@postfmly/logger"

import { default as dayjs } from "dayjs"
import { default as advancedFormat } from "dayjs/plugin/advancedFormat"
import { default as customParseFormat } from "dayjs/plugin/customParseFormat"
import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  type SlashCommandIntegerOption
} from "discord.js"
import { type SafeParseResult, safeParse } from "valibot"

import { BirthdaySchema, type IBirthday, MAX_DAYS, MAX_MONTHS, MIN_DAYS, MIN_MONTHS } from "../../db/schema.ts"
import { DB } from "../../utils/db.ts"

dayjs.extend(advancedFormat)
dayjs.extend(customParseFormat)

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
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

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const userId: string = interaction.user.id
  const userName: string = interaction.user.displayName

  try {
    const month: number = interaction.options.getInteger("month") as number
    const day: number = interaction.options.getInteger("day") as number

    const birthday: IBirthday = { userId, userName, month, day } satisfies IBirthday

    const b: SafeParseResult<BirthdaySchema> = safeParse(BirthdaySchema, birthday)
    if (!b.success) {
      throw new Error("Invalid birthday")
    }

    await DB.addBirthday(userId, userName, month, day)

    const date: string = `${month}/${day}`

    await interaction.editReply({
      content: `-# > 🎂  Birthday set to ${dayjs(date, "M/D").format("MMMM Do")}  🎉`
    })
  } catch (e) {
    error(`❌ Could not add birthday for ${interaction.user.displayName} (${interaction.user.id})`, e)

    await interaction.editReply({ content: "-# > ❌ Could not add birthday" })
  }
}

export { create, invoke }
