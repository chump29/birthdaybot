import { default as process } from "node:process"

import { error, info } from "@postfmly/logger"
import { type ILogoServerConfig, LogoServer } from "@postfmly/logoserver"
import { type Nullable } from "@postfmly/types"

import { ActivityType, Client, GatewayIntentBits } from "discord.js"

import { DB } from "./db.ts"
import { env } from "./env.ts"

const { DEBUG, LOGO_NAME, LOGO_PATH, LOGO_PORT, LOGO2_NAME, LOGO2_PATH, TOKEN }: typeof env = env

let SERVER: Nullable<LogoServer> = null

let CLIENT: Nullable<Client> = null
const TEST_CLIENT: Nullable<Client> = null

let isShutdown: boolean = false

const EVENTS: string[] = ["SIGINT", "SIGTERM"]

const shutdown = async (event: string): Promise<void> => {
  if (isShutdown) {
    return
  }

  if (DEBUG) {
    info(`❌ ${event} detected`)
  }

  info("🔴 Shutting down...")

  isShutdown = true

  await CLIENT?.destroy()

  await SERVER?.stop()

  DB.close()

  process.exit(0)
}

const setup = async (): Promise<Client> => {
  SERVER = new LogoServer({
    DEBUG,
    LOGO_NAME,
    LOGO_PATH,
    LOGO_PORT,
    LOGO2_NAME,
    LOGO2_PATH
  } as ILogoServerConfig)

  await SERVER.start()

  CLIENT = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    presence: {
      activities: [
        {
          name: "Partying...",
          type: ActivityType.Custom
        }
      ]
    }
  })

  for (const event of EVENTS) {
    process.on(event, (e: string): void => {
      shutdown(e).catch((err: unknown) => {
        error("❌ Error during shutdown", err)

        process.exit(1)
      })
    })
  }

  return CLIENT
}

const login = async (): Promise<Client> => {
  if (!CLIENT) {
    throw new Error("❌ Invalid CLIENT")
  }

  CLIENT = TEST_CLIENT ?? CLIENT

  await CLIENT.login(TOKEN)

  if (CLIENT.user && DEBUG) {
    info(`⚡ Connected as ${CLIENT.user.displayName} (${CLIENT.user.tag})`)
  }

  return CLIENT
}

export { login, setup, shutdown, TEST_CLIENT }
