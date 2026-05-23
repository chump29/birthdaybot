import { type ChatInputCommandInteraction } from "discord.js"

import { type ICommandFile } from "./loadCommands.ts"

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (interaction.isChatInputCommand()) {
    const commandFile: ICommandFile = await import(`${import.meta.dirname}/commands/${interaction.commandName}`)
    await commandFile.invoke(interaction)
  }
}

export { invoke }
