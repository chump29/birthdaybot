import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  out: "db",
  schema: "db/schema.ts"
})
