import { glob, unlink } from "node:fs/promises"
import { join } from "node:path"

import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test"

import { fakerEN_US as fake } from "@faker-js/faker"
import { default as dayjs } from "dayjs"

import { MAX_DAYS, MAX_ID_LEN, MAX_MONTHS, MIN_DAYS, MIN_ID_LEN, MIN_MONTHS } from "../../db/schema.ts"
import { DB } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"

if (!env.TEST_FULL) {
  spyOn(console, "info").mockImplementation((): void => undefined)
}

const path = join(env.DB_PATH, env.DB_NAME)

beforeAll(async (): Promise<void> => {
  for await (const file of glob(`${path}*`)) {
    await unlink(file)
  }

  DB.open()
})

afterAll((): void => {
  DB.close()
})

describe("db", (): void => {
  const getUserId = (): string =>
    fake.string.numeric({
      length: {
        max: MAX_ID_LEN,
        min: MIN_ID_LEN
      }
    })

  const getUserName = (): string => fake.internet.displayName()

  const userId = getUserId()

  const date = dayjs()
  const month = date.month() + 1
  const day = date.date()

  test("getBirthday", async (): Promise<void> => {
    const userName = getUserName()
    const m = fake.number.int({
      max: MAX_MONTHS,
      min: MIN_MONTHS
    })
    const d = fake.number.int({
      max: MAX_DAYS,
      min: MIN_DAYS
    })

    await DB.addBirthday(userId, userName, m, d)

    const birthday = await DB.getBirthday(userId)

    expect(birthday).not.toBeUndefined()

    expect(birthday?.userName).toBe(userName)
    expect(birthday?.month).toBe(m)
    expect(birthday?.day).toBe(d)
  })

  test("getBirthdaysToday", async (): Promise<void> => {
    await DB.addBirthday(getUserId(), getUserName(), month, day)

    const birthdays = await DB.getBirthdaysToday()

    expect(birthdays).toHaveLength(1)
  })

  test("getBirthdays", async (): Promise<void> => {
    const birthdays = await DB.getBirthdays()

    expect(birthdays).toHaveLength(2)
  })

  test("isValidUser", async (): Promise<void> => {
    expect(await DB.isValidUser(userId)).toBeTrue()
  })

  test("deleteBirthday", async (): Promise<void> => {
    await DB.deleteBirthday(userId)

    const birthdays = await DB.getBirthdays()

    expect(birthdays).toHaveLength(1)

    expect(birthdays[0]?.month).toBe(month)
    expect(birthdays[0]?.day).toBe(day)
  })
})
