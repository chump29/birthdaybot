import { glob, unlink } from "node:fs/promises"

import { afterAll, beforeAll, describe, expect, type jest, spyOn, test } from "bun:test"

import { type Optional } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"

import {
  type IBirthday,
  MAX_DAYS,
  MAX_MONTHS,
  MAX_USER_ID_LEN,
  MIN_DAYS,
  MIN_MONTHS,
  MIN_USER_ID_LEN
} from "../db/schema.ts"
import { DB } from "../utils/db.ts"
import { env } from "../utils/env.ts"

const { DB_NAME, DB_PATH }: typeof env = env

const infoSpy: jest.Mock = spyOn(console, "info")

const deleteFiles = async (): Promise<void> => {
  for await (const file of glob(`${DB_PATH}/${DB_NAME}*`)) {
    await unlink(file)
  }
}

beforeAll(async (): Promise<void> => {
  infoSpy.mockReset()

  await deleteFiles()

  DB.open()
})

afterAll(async (): Promise<void> => {
  await deleteFiles()

  DB.close()
})

describe("db", (): void => {
  const getUserId = (): string =>
    fake.string.numeric({
      length: {
        max: MAX_USER_ID_LEN,
        min: MIN_USER_ID_LEN
      }
    })

  const getUserName = (): string => fake.internet.displayName()

  const userId: string = getUserId()

  const date: Date = new Date()
  const month: number = date.getMonth() + 1
  const day: number = date.getDate()

  test("getBirthday", async (): Promise<void> => {
    const userName: string = getUserName()
    const m: number = fake.number.int({
      max: MAX_MONTHS,
      min: MIN_MONTHS
    })
    const d: number = fake.number.int({
      max: MAX_DAYS,
      min: MIN_DAYS
    })

    await DB.addBirthday(userId, userName, m, d)

    const birthday: Optional<IBirthday> = await DB.getBirthday(userId)

    expect(birthday).not.toBeUndefined()

    expect(birthday?.userName).toBe(userName)
    expect(birthday?.month).toBe(m)
    expect(birthday?.day).toBe(d)
  })

  test("getBirthdaysToday", async (): Promise<void> => {
    await DB.addBirthday(getUserId(), getUserName(), month, day)

    const birthdays: IBirthday[] = await DB.getBirthdaysToday()

    expect(birthdays).toHaveLength(1)
  })

  test("getBirthdays", async (): Promise<void> => {
    const birthdays: IBirthday[] = await DB.getBirthdays()

    expect(birthdays).toHaveLength(2)
  })

  test("isValidUser", async (): Promise<void> => {
    expect(await DB.isValidUser(userId)).toBeTrue()
  })

  test("deleteBirthday", async (): Promise<void> => {
    await DB.deleteBirthday(userId)

    const birthdays: IBirthday[] = await DB.getBirthdays()

    expect(birthdays).toHaveLength(1)

    expect(birthdays[0]?.month).toBe(month)
    expect(birthdays[0]?.day).toBe(day)
  })
})
