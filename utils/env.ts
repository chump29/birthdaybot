import { printVars } from "@postfmly/logger"
import { type Optional } from "@postfmly/types"

import { bool, cleanEnv, type ExactValidator, makeExactValidator, str, url } from "envalid"
import { anyOf, caseInsensitive, charIn, createRegExp, exactly, wordChar } from "magic-regexp"
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
  toNumber,
  trim,
  union
} from "valibot"

const COLOR_LEN: number = 6

const MIN_ID_LEN: number = 17
const MAX_ID_LEN: number = 19

const MIN_PORT: number = 1024
const MAX_PORT: number = 65_535

const UID_MIN_LEN: number = 23
const UID_MAX_LEN: number = 28
const TS_MIN_LEN: number = 6
const TS_MAX_LEN: number = 7
const HMAC_MIN_LEN: number = 27
const HMAC_MAX_LEN: number = 38

const StringSchema = pipe(string(), trim(), nonEmpty())
const IdSchema = pipe(StringSchema, digits(), minLength(MIN_ID_LEN), maxLength(MAX_ID_LEN))
const ColorSchema = pipe(
  StringSchema,
  regex(
    // ! Desired: /^(?:#[\da-f]{6})$/i
    createRegExp(exactly("#").at.lineStart(), charIn("0123456789abcdef").times(COLOR_LEN).at.lineEnd(), [
      caseInsensitive
    ])
  )
)
const PortSchema = union([
  pipe(literal("random")),
  pipe(StringSchema, toNumber(), integer(), minValue(MIN_PORT), maxValue(MAX_PORT))
])
const TokenSchema = pipe(
  StringSchema,
  regex(
    createRegExp(
      anyOf(wordChar, "-").times.between(UID_MIN_LEN, UID_MAX_LEN).at.lineStart(),
      exactly("."),
      anyOf(wordChar, "-").times.between(TS_MIN_LEN, TS_MAX_LEN),
      exactly("."),
      anyOf(wordChar, "-").times.between(HMAC_MIN_LEN, HMAC_MAX_LEN).at.lineEnd(),
      [caseInsensitive]
    )
  )
)

const idValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(IdSchema, s))
const colorValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(ColorSchema, s))
const portValidator: ExactValidator<"random" | number> = makeExactValidator<"random" | number>(
  (s: string): "random" | number => parse(PortSchema, s)
)
const tokenValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(TokenSchema, s))

let getFakeId = (): string => "Implemented during testing"
let getFakeURL = (): string => "Implemented during testing"

let fakeToken: Optional<string>

if (Bun.env.NODE_ENV === "test") {
  const { fakerEN_US: fake } = await import("@faker-js/faker")

  let chars: string = "[0-9]"
  getFakeId = (): string => fake.helpers.fromRegExp(`${chars}{${MIN_ID_LEN},${MAX_ID_LEN}}`)

  getFakeURL = (): string => fake.image.url({ height: 64, width: 64 })

  chars = "[a-zA-Z0-9]"
  fakeToken = fake.helpers.fromRegExp(
    `${chars}{${UID_MIN_LEN},${UID_MAX_LEN}}[.]${chars}{${TS_MIN_LEN},${TS_MAX_LEN}}[.]${chars}{${HMAC_MIN_LEN},${HMAC_MAX_LEN}}`
  )
}

const env = cleanEnv(Bun.env, {
  ACTIVITY: str({ default: "Celebrating" }),
  CHANNEL_ID: idValidator({ testDefault: getFakeId() }),
  COLOR: colorValidator({ default: "#78866b" }),
  DB_NAME: str({ default: "birthdaybot.db", testDefault: "birthdaybot.test.db" }),
  DB_PATH: str({ default: "./db" }),
  DEBUG: bool({ default: false, testDefault: true }),
  GUILD_ID: idValidator({ testDefault: getFakeId() }),
  LOGO_NAME: str({ default: "birthdaybot.webp" }),
  LOGO_PATH: str({ default: "./utils/images" }),
  LOGO_PORT: portValidator({ default: "random" }),
  LOGO_URL: url({ testDefault: getFakeURL() }),
  LOGO2_NAME: str({ default: "birthday.webp" }),
  LOGO2_PATH: str({ default: "./utils/images" }),
  LOGO2_URL: url({ testDefault: getFakeURL() }),
  NAME: str({ default: "BirthdayBot" }),
  ROLE_ID: idValidator({ testDefault: getFakeId() }),
  TOKEN: tokenValidator({ testDefault: fakeToken })
})

if (import.meta.main) {
  printVars(env, ["CHANNEL_ID", "GUILD_ID", "ROLE_ID", "TOKEN"])
}

export { env }
