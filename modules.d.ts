declare module "bun" {
  interface Env {
    CHANNEL_ID: string
    DB_NAME: string
    DB_PATH: string
    DEBUG: boolean
    DEBUG_SQL: string
    GUILD_ID: string
    IS_DEBUG: string
    LOGO_URL: string
    LOGO2_URL: string
    NAME: string
    npm_package_version: string
    ROLE_ID: string
    TOKEN: string
  }
}
