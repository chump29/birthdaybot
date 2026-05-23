import { type InferSelectModel } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

const birthdays = sqliteTable("birthdays", {
  day: integer().notNull(),
  id: integer().primaryKey(),
  is_updated: integer({
    mode: "boolean"
  }).default(false),
  month: integer().notNull(),
  user_id: text().notNull().unique()
})

type IBirthday = InferSelectModel<typeof birthdays>

export { birthdays, type IBirthday }
