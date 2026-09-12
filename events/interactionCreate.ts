import { type ChatInputCommandInteraction, type Interaction } from "discord.js"

interface ICommandFile {
  invoke: (interaction: ChatInputCommandInteraction) => Promise<void>
}

const invoke = async (interaction: Interaction): Promise<void> => {
  if (!interaction.isChatInputCommand()) {
    return
  }

  const commandFile: ICommandFile = await import(`${import.meta.dirname}/commands/${interaction.commandName}`)
  await commandFile.invoke(interaction)
}

export { invoke }
