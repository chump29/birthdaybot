import { error, info } from "@postfmly/logger"

import { Birthday } from "./utils/birthday.ts"
import { Client } from "./utils/client.ts"
import { DB } from "./utils/db.ts"
import { env } from "./utils/env.ts"

try {
  DB.open()

  await Birthday.init(await Client.init())

  info(`🟢 ${env.ACTIVITY}...`)
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e)

  error(`❌ ${msg}`)

  await Client.shutdown(msg)
}
