import { error, info } from "@postfmly/logger"

import { init, shutdown } from "./utils/client.ts"
import { DB } from "./utils/db.ts"
import { env } from "./utils/env.ts"
import { initBirthdays } from "./utils/loadBirthdays.ts"

try {
  DB.open()

  await initBirthdays(await init())

  info(`🟢 ${env.ACTIVITY}...`)
} catch (e: unknown) {
  error(e)

  await shutdown()
}
