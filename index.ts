import { error, info } from "@postfmly/logger"

import { loadCommands } from "./events/loadCommands.ts"
import { login, setup, shutdown } from "./utils/client.ts"
import { DB } from "./utils/db.ts"
import { handleBirthdays, loadSettings } from "./utils/loadBirthdays.ts"

try {
  DB.open()

  await loadCommands(await setup())

  await loadSettings(await login())

  info("Running...")

  await handleBirthdays()
} catch (e: unknown) {
  error(e)

  shutdown("ERROR")
}
