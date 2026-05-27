import { glob, unlink } from "node:fs/promises"

import { type Database } from "bun:sqlite"
import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test"

import { info } from "@postfmly/logger"

import { int } from "@nano-faker/core"
import { username } from "@nano-faker/internet"
import { fake } from "@nano-faker/patterns"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { EnhancedQueryLogger } from "drizzle-query-logger"

import { birthdays, type IBirthday } from "../db/schema.ts"
import {
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
} from "./db.ts"

mock.module("./db.ts", (): unknown => {
  return {
    TEST_DB: drizzle({
      client: TEST_SQLITE as Database,
      jit: true,
      logger: Bun.env.DEBUG_SQL === "true" ? new EnhancedQueryLogger() : undefined
    })
  }
})

const deleteFiles = async (): Promise<void> => {
  for await (const file of glob(`${Bun.env.DB_PATH}/${Bun.env.DB_NAME}*`)) {
    info(`Deleting ${file}`)
    await unlink(file)
  }
}

beforeAll(async (): Promise<void> => {
  await deleteFiles().then(async (): Promise<void> => await openDatabase())
})

afterAll(async (): Promise<void> => {
  await deleteFiles().then(async (): Promise<void> => {
    await closeDatabase()
  })
})

let userId: string = ""

describe("db", (): void => {
  test("addBirthday", async (): Promise<void> => {
    const ID_LEN: number = 19
    userId = fake("#".repeat(ID_LEN))
    const userName: string = username()
    const month: number = int(MIN_MONTHS, MAX_MONTHS)
    const day: number = int(MIN_DAYS, MAX_DAYS)
    await addBirthday(userId, userName, month, day)

    expect(TEST_DB).not.toBeNull()
    let birthday: IBirthday | undefined = undefined
    if (TEST_DB) {
      ;[birthday] = await TEST_DB.select().from(birthdays).where(eq(birthdays.user_id, userId))
    }

    expect(birthday).not.toBeUndefined()
    if (!birthday) {
      throw new Error("Invalid birthday")
    }
    expect(birthday.user_id).toBe(userId)
    expect(birthday.month).toBe(month)
    expect(birthday.day).toBe(day)
  })

  test("getBirthdays", async (): Promise<void> => {
    const birthdays: IBirthday[] = await getBirthdays()

    expect(birthdays.length).toBe(1)
  })

  test("deleteBirthday", async (): Promise<void> => {
    await deleteBirthday(userId)

    let birthday: IBirthday | undefined = undefined
    if (TEST_DB) {
      ;[birthday] = await TEST_DB.select().from(birthdays).where(eq(birthdays.user_id, userId))
    }

    expect(birthday).toBeUndefined()
  })
})
