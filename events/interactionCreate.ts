import { join } from "node:path"

import { type ChatInputCommandInteraction, type Interaction } from "discord.js"

interface IInvoke {
  invoke: (interaction: ChatInputCommandInteraction) => Promise<void>
}

const invoke = async (interaction: Interaction): Promise<void> => {
  if (!interaction.isChatInputCommand()) {
    return
  }

  const file: IInvoke = await import(join(import.meta.dir, "commands", interaction.commandName))
  await file.invoke(interaction)
}

export { type IInvoke, invoke }
