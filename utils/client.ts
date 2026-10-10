import { default as process } from "node:process"

import { error, info } from "@postfmly/logger"
import { type ILogoServerConfig, LogoServer } from "@postfmly/logoserver"
import { type Nullable } from "@postfmly/types"

import { ActivityType, Client as DiscordClient, GatewayIntentBits } from "discord.js"

import { loadCommands } from "../events/loadCommands.ts"
import { DB } from "./db.ts"
import { env } from "./env.ts"

interface IBirthdayBotClient {
  init: (testClient?: DiscordClient) => Promise<DiscordClient>
  shutdown: (event?: string) => Promise<void>
}

class BirthdayBotClient implements IBirthdayBotClient {
  private CLIENT: Nullable<DiscordClient> = null

  private LOGO_SERVER: Nullable<LogoServer> = null

  private isShutdown: boolean = false

  async shutdown(event?: string): Promise<void> {
    if (this.isShutdown) {
      return
    }

    if (event && env.DEBUG) {
      info(`❌ ${event} detected`)
    }

    info("🔴 Shutting down...")

    this.isShutdown = true

    await this.CLIENT?.destroy()

    await this.LOGO_SERVER?.stop()

    DB.close()

    process.exit(0)
  }

  private async login(): Promise<void> {
    if (!this.CLIENT) {
      throw new Error("Invalid CLIENT")
    }

    await this.CLIENT.login(env.TOKEN)

    if (this.CLIENT.user && env.DEBUG) {
      info(`⚡ Connected as ${this.CLIENT.user.displayName} (${this.CLIENT.user.tag})`)
    }
  }

  async init(testClient?: DiscordClient): Promise<DiscordClient> {
    this.LOGO_SERVER = new LogoServer({
      DEBUG: env.DEBUG,
      LOGO_NAME: env.LOGO_NAME,
      LOGO_PATH: env.LOGO_PATH,
      LOGO_PORT: env.LOGO_PORT,
      LOGO2_NAME: env.LOGO2_NAME,
      LOGO2_PATH: env.LOGO2_PATH
    } as ILogoServerConfig)

    await this.LOGO_SERVER.start()

    this.CLIENT =
      testClient ??
      new DiscordClient({
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
        this.shutdown(e).catch((err: unknown) => {
          error("❌ Error during shutdown", err)

          process.exit(1)
        })
      })
    }

    await loadCommands(this.CLIENT)

    await this.login()

    return this.CLIENT
  }
}

const Client: IBirthdayBotClient = new BirthdayBotClient()

export { Client }
