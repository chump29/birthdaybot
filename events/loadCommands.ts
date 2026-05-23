import {
  type ChatInputCommandInteraction,
  type Client,
  Events,
  type Interaction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody
} from "discord.js"

interface IClientReady {
  invoke(client: Client): Promise<void>
}

interface IInteractionCreate {
  invoke(interaction: ChatInputCommandInteraction): Promise<void>
}

interface ICommandFile {
  create(): Promise<RESTPostAPIChatInputApplicationCommandsJSONBody>
  invoke(interaction: ChatInputCommandInteraction): Promise<void>
}

const loadCommands = async (client: Client): Promise<void> => {
  const interactionCreate: IInteractionCreate = await import(`${import.meta.dirname}/${Events.InteractionCreate}.ts`)
  client.on(Events.InteractionCreate, async (interaction: Interaction): Promise<void> => {
    await interactionCreate.invoke(interaction as ChatInputCommandInteraction)
  })

  const clientReady: IClientReady = await import(`${import.meta.dirname}/${Events.ClientReady}.ts`)
  client.once(Events.ClientReady, async (client: Client): Promise<void> => {
    await clientReady.invoke(client)
  })
}

export { type ICommandFile, loadCommands }
