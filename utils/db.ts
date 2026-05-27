import { mkdir, readdir } from "node:fs/promises"

import { Database, SQLiteError } from "bun:sqlite"

import { info } from "@postfmly/logger"

import { eq, sql } from "drizzle-orm"
import { drizzle, type SQLiteBunDatabase } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"

import { birthdays, type IBirthday } from "../db/schema.ts"

let SQLITE: Database | null = null
let TEST_SQLITE: Database | null = null
let DB: SQLiteBunDatabase | null = null
const TEST_DB: SQLiteBunDatabase | null = null

const MIN_MONTHS: number = 1
const MAX_MONTHS: number = 12
const MIN_DAYS: number = 1
const MAX_DAYS: number = 31

Bun.env.DB_NAME = Bun.env.DB_NAME || "birthdaybot.db"
Bun.env.DB_PATH = Bun.env.DB_PATH || "./db/"

const insertOrUpdate = {
  Insert: "Added",
  Update: "Updated"
} as const

const openDatabase = async (): Promise<void> => {
  await mkdir(Bun.env.DB_PATH, {
    recursive: true
  })

  const DB_STR: string = `${Bun.env.DB_PATH}${Bun.env.DB_NAME}`

  SQLITE = new Database(DB_STR, {
    create: true,
    strict: true
  })

  if (Bun.env.NODE_ENV === "test") {
    TEST_SQLITE = SQLITE
  }

  DB =
    TEST_DB ??
    drizzle({
      client: SQLITE,
      jit: true
    })
  DB.run(
    sql.raw(`
      PRAGMA journal_mode = WAL;
      PRAGMA wal_checkpoint(TRUNCATE);`)
  )

  try {
    await DB.select().from(birthdays)
  } catch (e: unknown) {
    if (e instanceof SQLiteError && e.message.includes("no such table")) {
      if (Bun.env.DEBUG) {
        info("Creating tables")
      }

      await readdir(Bun.env.DB_PATH, {
        recursive: true
      })
        .then((files: string[]): void => {
          if (!files.filter((file: string): boolean => file.endsWith(".sql")).length) {
            throw new Error("Could not find SQL script")
          }
        })
        .then((): void => {
          if (!DB) {
            throw new Error("Database not open")
          }

          migrate(DB, {
            migrationsFolder: Bun.env.DB_PATH
          })
        })
    } else {
      throw e
    }
  }

  if (Bun.env.DEBUG) {
    info(`Using database: ${DB_STR}`)
  }
}

const addBirthday = async (userId: string, userName: string, month: number, day: number): Promise<string> => {
  if (!DB) {
    throw new Error("Database not open")
  }

  const [birthday]: IBirthday[] = await DB.insert(birthdays)
    .values({
      day: day,
      month: month,
      user_id: userId,
      user_name: userName
    })
    .onConflictDoUpdate({
      target: birthdays.user_id,
      set: {
        day: day,
        is_updated: true,
        month: month
      }
    })
    .returning()

  return birthday?.is_updated ? insertOrUpdate.Update : insertOrUpdate.Insert
}

const deleteBirthday = async (userId: string): Promise<void> => {
  if (!DB) {
    throw new Error("Database not open")
  }

  await DB.delete(birthdays).where(eq(birthdays.user_id, userId))
}

const getBirthdays = async (): Promise<IBirthday[]> => {
  if (!DB) {
    throw new Error("Database not open")
  }

  return await DB.select().from(birthdays)
}

const closeDatabase = async (): Promise<void> => {
  SQLITE?.close()

  if (Bun.env.DEBUG) {
    info("Database closed")
  }
}

export {
  addBirthday,
  closeDatabase,
  deleteBirthday,
  getBirthdays,
  MAX_DAYS,
  MAX_MONTHS,
  MIN_DAYS,
  MIN_MONTHS,
  openDatabase,
  TEST_DB,
  TEST_SQLITE
}
