import { readdir } from "node:fs/promises"
import { parse } from "node:path"

import { type Client, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js"

import { info } from "@postfmly/logger"

import { type ICommandFile } from "./loadCommands.ts"

const invoke = async (client: Client): Promise<void> => {
  if (!client.application || !client.user) {
    throw new Error("Invalid client")
  }

  const commands: string[] = await readdir(`${import.meta.dirname}/commands`).then((dir: string[]): string[] => {
    return dir.filter((file: string): boolean => file.endsWith(".ts"))
  })

  const commandsArray: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
  await Promise.all(
    commands.map(async (command: string): Promise<void> => {
      const commandFile: ICommandFile = await import(`${import.meta.dirname}/commands/${command}`)
      commandsArray.push(await commandFile.create())

      if (Bun.env.DEBUG) {
        info(`Loaded /${parse(command).name} command`)
      }
    })
  )
  client.application.commands.set(commandsArray)
}

export { invoke }
