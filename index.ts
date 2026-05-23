import { type Client } from "discord.js"

import { error, info } from "@postfmly/logger"
import { startLogoServer } from "@postfmly/logoserver"

import { parseBoolean } from "@marianmeres/parse-boolean"

import { loadCommands } from "./events/loadCommands.ts"
import { client, login, shutdown } from "./utils/client.ts"
import { openDatabase } from "./utils/db.ts"
import { handleBirthdays, loadSettings } from "./utils/loadBirthdays.ts"

Bun.env.DEBUG = parseBoolean(Bun.env.IS_DEBUG)

Bun.env.NAME = Bun.env.NAME ?? "BirthdayBot"

await openDatabase()
  .then(async (): Promise<void> => await loadCommands(await client()))
  .then(async (): Promise<Client> => await login())
  .then(async (client: Client): Promise<void> => await loadSettings(client))
  .then(async (): Promise<void> => await startLogoServer())
  .then((): void => info("Running..."))
  .then(async (): Promise<void> => await handleBirthdays())
  .catch(async (e: unknown): Promise<void> => {
    error(e)
    await shutdown("ERROR")
  })
