import { join } from "node:path"

import { Database } from "bun:sqlite"

import { info } from "@postfmly/logger"
import { type Nullable, type Optional } from "@postfmly/types"

import { default as dayjs } from "dayjs"
import { and, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"

import { birthdays, type IBirthday } from "../db/schema.ts"
import { env } from "./env.ts"

type DBType = ReturnType<typeof drizzle>

interface IBirthdayBotDatabase {
  addBirthday: (userId: string, userName: string, month: number, day: number) => Promise<void>
  close: () => void
  deleteBirthday: (userId: string) => Promise<void>
  getBirthday: (userId: string) => Promise<Optional<IBirthday>>
  getBirthdays: () => Promise<IBirthday[]>
  getBirthdaysToday: () => Promise<IBirthday[]>
  readonly instance: Nullable<DBType>
  isValidUser: (userId: string) => Promise<boolean>
  open: () => void
}

class BirthdayBotDatabase implements IBirthdayBotDatabase {
  private client: Nullable<Database> = null
  instance: Nullable<DBType> = null

  open(): void {
    if (this.instance) {
      if (env.DEBUG) {
        info("⚠️  Database already open")
      }

      return
    }

    const dbPathName = join(env.DB_PATH, env.DB_NAME)

    this.client = new Database(dbPathName, {
      create: true,
      strict: true
    })

    this.client.run(`
      PRAGMA busy_timeout = 3000;
      PRAGMA foreign_keys = 1;
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA wal_checkpoint(TRUNCATE);
    `)

    this.instance = drizzle({
      client: this.client,
      jit: true
    })

    migrate(this.instance, {
      migrationsFolder: env.DB_PATH
    })

    if (env.DEBUG) {
      info(`▶️  Using database: ${dbPathName}`)
    }
  }

  close(): void {
    if (!this.instance) {
      if (env.DEBUG) {
        info("⚠️  Database already closed")
      }

      return
    }

    this.client?.close()
    this.client = null

    this.instance = null

    if (env.DEBUG) {
      info("⏹️  Database closed")
    }
  }

  private dbCheck(): DBType {
    if (!this.instance) {
      throw new Error("Database not open")
    }

    return this.instance
  }

  // * /birthday <month> <day>
  async addBirthday(userId: string, userName: string, month: number, day: number): Promise<void> {
    await this.dbCheck().insert(birthdays).values({ userId, userName, day, month }).onConflictDoUpdate({
      set: { day, month },
      target: birthdays.userId
    })
  }

  async isValidUser(userId: string): Promise<boolean> {
    const [birthday] = await this.dbCheck()
      .select({ userId: birthdays.userId })
      .from(birthdays)
      .where(eq(birthdays.userId, userId))
      .limit(1)

    return Boolean(birthday)
  }

  // * /delete
  async deleteBirthday(userId: string): Promise<void> {
    await this.dbCheck().delete(birthdays).where(eq(birthdays.userId, userId))
  }

  // * /show
  async getBirthday(userId: string): Promise<Optional<IBirthday>> {
    const [birthday] = await this.dbCheck().select().from(birthdays).where(eq(birthdays.userId, userId)).limit(1)

    return birthday
  }

  // * /list
  async getBirthdays(): Promise<IBirthday[]> {
    return await this.dbCheck().select().from(birthdays)
  }

  async getBirthdaysToday(): Promise<IBirthday[]> {
    const date = dayjs()
    const month = date.month() + 1
    const day = date.date()

    return await this.dbCheck()
      .select()
      .from(birthdays)
      .where(and(eq(birthdays.month, month), eq(birthdays.day, day)))
  }
}

export const DB = new BirthdayBotDatabase()
