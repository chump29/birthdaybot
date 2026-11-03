import { readdir } from "node:fs/promises"
import { join, parse } from "node:path"

import { info } from "@postfmly/logger"

import { type Client, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js"

import { env } from "../utils/env.ts"

interface ICreate {
  create: () => RESTPostAPIChatInputApplicationCommandsJSONBody
}

const invoke = async (client: Client): Promise<void> => {
  if (!(client.application && client.user)) {
    throw new Error("Invalid client")
  }

  const commands = (await readdir(join(import.meta.dir, "commands"))).filter((file: string): boolean =>
    file.endsWith(".ts")
  )

  const commandsArray: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
  await Promise.allSettled(
    commands.map(async (command: string): Promise<void> => {
      const file: ICreate = await import(join(import.meta.dir, "commands", command))
      commandsArray.push(file.create())

      if (env.DEBUG) {
        info(`🔨 Loaded /${parse(command).name} command`)
      }
    })
  )
  client.application.commands.set(commandsArray)
}

export { type ICreate, invoke }
