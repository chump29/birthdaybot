import { integer, snakeCase, text } from "drizzle-orm/sqlite-core"
import { createInsertSchema } from "drizzle-orm/valibot"
import {
  type GenericSchema,
  integer as integer_,
  maxLength,
  maxValue,
  minLength,
  minValue,
  nonEmpty,
  number,
  pipe,
  string,
  trim
} from "valibot"

const MIN_USER_ID_LEN: number = 17
const MAX_USER_ID_LEN: number = 19

const MIN_USER_NAME_LEN: number = 2
const MAX_USER_NAME_LEN: number = 32

const MIN_MONTHS: number = 1
const MAX_MONTHS: number = 12

const MIN_DAYS: number = 1
const MAX_DAYS: number = 31

const birthdays = snakeCase.table("birthdays", {
  day: integer().notNull(),
  id: integer().primaryKey(),
  month: integer().notNull(),
  userId: text({ length: MAX_USER_ID_LEN }).notNull().unique(),
  userName: text({ length: MAX_USER_NAME_LEN }).notNull()
})

type IBirthday = Omit<typeof birthdays.$inferInsert, "id">

const StringSchema = pipe(string(), trim(), nonEmpty())

const BirthdaySchema = createInsertSchema(birthdays, {
  day: (): GenericSchema => pipe(number(), integer_(), minValue(MIN_DAYS), maxValue(MAX_DAYS)),
  month: (): GenericSchema => pipe(number(), integer_(), minValue(MIN_MONTHS), maxValue(MAX_MONTHS)),
  userId: (): GenericSchema => pipe(StringSchema, minLength(MIN_USER_ID_LEN), maxLength(MAX_USER_ID_LEN)),
  userName: (): GenericSchema => pipe(StringSchema, minLength(MIN_USER_NAME_LEN), maxLength(MAX_USER_NAME_LEN))
})

type BirthdaySchema = typeof BirthdaySchema

export {
  BirthdaySchema,
  birthdays,
  type IBirthday,
  MAX_DAYS,
  MAX_MONTHS,
  MAX_USER_ID_LEN,
  MIN_DAYS,
  MIN_MONTHS,
  MIN_USER_ID_LEN
}
