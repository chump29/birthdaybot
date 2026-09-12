import { error } from "@postfmly/logger"

import { type Client, Events, type Interaction } from "discord.js"

interface IClientReady {
  invoke: (client: Client) => Promise<void>
}

interface IInteractionCreate {
  invoke: (interaction: Interaction) => Promise<void>
}

const loadCommands = async (client: Client): Promise<void> => {
  const interactionCreate: IInteractionCreate = await import(`${import.meta.dirname}/${Events.InteractionCreate}.ts`)
  client.on(Events.InteractionCreate, async (interaction: Interaction): Promise<void> => {
    try {
      await interactionCreate.invoke(interaction)
    } catch (e) {
      error(`❌ ${interaction.isCommand() ? interaction.commandName : "Unknown"}:`, e)
    }
  })

  const clientReady: IClientReady = await import(`${import.meta.dirname}/${Events.ClientReady}.ts`)
  client.once(Events.ClientReady, async (c: Client): Promise<void> => {
    await clientReady.invoke(c)
  })
}

export { loadCommands }
