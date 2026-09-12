import { bool, cleanEnv, type ExactValidator, makeExactValidator, url } from "envalid"
import {
  digits,
  integer,
  literal,
  maxLength,
  maxValue,
  minLength,
  minValue,
  nonEmpty,
  parse,
  pipe,
  regex,
  string,
  toLowerCase,
  toNumber,
  trim,
  union
} from "valibot"

const MIN_ID_LEN: number = 17
const MAX_ID_LEN: number = 20

const MAX_ROLE_ID_LEN: number = 19

const MIN_PORT: number = 1024
const MAX_PORT: number = 65_535

const StringSchema = pipe(string(), trim(), nonEmpty())
const ChannelIdSchema = pipe(StringSchema, digits(), minLength(MIN_ID_LEN), maxLength(MAX_ID_LEN))
const ColorSchema = pipe(StringSchema, regex(/[\da-f]{6}/i))
const GuildIdSchema = pipe(StringSchema, digits(), minLength(MIN_ID_LEN), maxLength(MAX_ID_LEN))
const PortSchema = union([
  pipe(StringSchema, toLowerCase(), literal("random")),
  pipe(StringSchema, digits(), toNumber(), integer(), minValue(MIN_PORT), maxValue(MAX_PORT))
])
const RoleIdSchema = pipe(StringSchema, digits(), minLength(MIN_ID_LEN), maxLength(MAX_ROLE_ID_LEN))
const TokenSchema = pipe(StringSchema, regex(/^[\w-]{24,26}\.[\w-]{6}\.[\w-]{25,110}$/))

const channelIdValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string =>
  parse(ChannelIdSchema, s)
)
const colorValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(ColorSchema, s))
const guildIdValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string =>
  parse(GuildIdSchema, s)
)
const roleIdValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string =>
  parse(RoleIdSchema, s)
)
const stringValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string =>
  parse(StringSchema, s)
)
const portValidator: ExactValidator<"random" | number> = makeExactValidator<"random" | number>(
  (s: string): "random" | number => parse(PortSchema, s)
)
const tokenValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(TokenSchema, s))

const getRandomString = (): string => {
  const Base36: number = 36

  return Math.random().toString(Base36).slice(2)
}

const env = cleanEnv(Bun.env, {
  CHANNEL_ID: channelIdValidator({ testDefault: getRandomString() }),
  COLOR: colorValidator({ default: "78866b" }),
  DB_NAME: stringValidator({ default: "birthdaybot.db", testDefault: "birthdaybot.test.db" }),
  DB_PATH: stringValidator({ default: "./db" }),
  DEBUG: bool({ default: false, testDefault: true }),
  GUILD_ID: guildIdValidator({ testDefault: getRandomString() }),
  LOGO_NAME: stringValidator({ default: "birthdaybot.webp" }),
  LOGO_PATH: stringValidator({ default: "./utils/images" }),
  LOGO_PORT: portValidator({ default: "random" }),
  LOGO_URL: url({ testDefault: "my.url" }),
  LOGO2_NAME: stringValidator({ default: "birthday.webp" }),
  LOGO2_PATH: stringValidator({ default: "./utils/images" }),
  LOGO2_URL: url({ testDefault: "my.url2" }),
  NAME: stringValidator({ default: "BirthdayBot" }),
  ROLE_ID: roleIdValidator({ testDefault: getRandomString() }),
  TOKEN: tokenValidator({ testDefault: getRandomString() })
})

export { env }
