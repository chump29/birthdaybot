import { default as process } from "node:process"

import { error, info } from "@postfmly/logger"
import { type ILogoServerConfig, LogoServer } from "@postfmly/logoserver"
import { type Nullable } from "@postfmly/types"

import { ActivityType, Client, GatewayIntentBits } from "discord.js"

import { loadCommands } from "../events/loadCommands.ts"
import { DB } from "./db.ts"
import { env } from "./env.ts"

let SERVER: Nullable<LogoServer> = null

let CLIENT: Nullable<Client> = null
const TEST_CLIENT: Nullable<Client> = null

let isShutdown: boolean = false

const shutdown = async (event: string = "ERROR"): Promise<void> => {
  if (isShutdown) {
    return
  }

  if (env.DEBUG) {
    info(`❌ ${event} detected`)
  }

  info("🔴 Shutting down...")

  isShutdown = true

  await CLIENT?.destroy()

  await SERVER?.stop()

  DB.close()

  process.exit(0)
}

const login = async (): Promise<void> => {
  if (!CLIENT) {
    throw new Error("Invalid CLIENT")
  }

  CLIENT = TEST_CLIENT ?? CLIENT

  await CLIENT.login(env.TOKEN)

  if (CLIENT.user && env.DEBUG) {
    info(`⚡ Connected as ${CLIENT.user.displayName} (${CLIENT.user.tag})`)
  }
}

const init = async (): Promise<Client> => {
  SERVER = new LogoServer({
    DEBUG: env.DEBUG,
    LOGO_NAME: env.LOGO_NAME,
    LOGO_PATH: env.LOGO_PATH,
    LOGO_PORT: env.LOGO_PORT,
    LOGO2_NAME: env.LOGO2_NAME,
    LOGO2_PATH: env.LOGO2_PATH
  } as ILogoServerConfig)

  await SERVER.start()

  CLIENT = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    presence: {
      activities: [
        {
          name: `${env.ACTIVITY}...`,
          type: ActivityType.Custom
        }
      ]
    }
  })

  for (const event of ["SIGINT", "SIGTERM"]) {
    process.on(event, (e: string): void => {
      shutdown(e).catch((err: unknown) => {
        error("❌ Error during shutdown", err)

        process.exit(1)
      })
    })
  }

  await loadCommands(CLIENT)

  await login()

  return CLIENT
}

export { init, shutdown, TEST_CLIENT }
