import { printVars } from "@postfmly/logger"
import { type Optional } from "@postfmly/types"

import { type HexColorString } from "discord.js"
import { bool, cleanEnv, makeExactValidator, str, url } from "envalid"
import { anyOf, caseInsensitive, charIn, createRegExp, exactly, wordChar } from "magic-regexp"
import {
  digits,
  guard,
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

import { MAX_ID_LEN, MIN_ID_LEN } from "../db/schema.ts"

const COLOR_LEN = 6

const MIN_PORT = 1024
const MAX_PORT = 65_535

const UID_MIN_LEN = 23
const UID_MAX_LEN = 28
const TS_MIN_LEN = 6
const TS_MAX_LEN = 7
const HMAC_MIN_LEN = 27
const HMAC_MAX_LEN = 38

const StringSchema = pipe(string(), trim(), nonEmpty())
const IdSchema = pipe(StringSchema, digits(), minLength(MIN_ID_LEN), maxLength(MAX_ID_LEN))
const ColorSchema = pipe(
  StringSchema,
  regex(
    createRegExp(
      exactly("#").at.lineStart(),
      charIn.from("0", "9").orChar.from("a", "f").times(COLOR_LEN).at.lineEnd(),
      [caseInsensitive]
    )
  ),
  guard((_: string): _ is HexColorString => true)
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

const idValidator = makeExactValidator<string>((s: string): string => parse(IdSchema, s))
const colorValidator = makeExactValidator<HexColorString>((s: string): HexColorString => parse(ColorSchema, s))
const portValidator = makeExactValidator<"random" | number>((s: string): "random" | number => parse(PortSchema, s))
const tokenValidator = makeExactValidator<string>((s: string): string => parse(TokenSchema, s))

let fakeId: Optional<string>
let fakeURL: Optional<string>
let fakeToken: Optional<string>

if (Bun.env.NODE_ENV === "test") {
  const { fakerEN_US: fake } = await import("@faker-js/faker")

  let chars = "[0-9]"
  fakeId = fake.helpers.fromRegExp(`${chars}{${MIN_ID_LEN},${MAX_ID_LEN}}`)

  fakeURL = fake.image.url({ height: 64, width: 64 })

  chars = "[a-zA-Z0-9]"
  fakeToken = fake.helpers.fromRegExp(
    `${chars}{${UID_MIN_LEN},${UID_MAX_LEN}}[.]${chars}{${TS_MIN_LEN},${TS_MAX_LEN}}[.]${chars}{${HMAC_MIN_LEN},${HMAC_MAX_LEN}}`
  )
}

const env = cleanEnv(Bun.env, {
  ACTIVITY: str({ default: "Celebrating" }),
  CHANNEL_ID: idValidator({ testDefault: fakeId }),
  COLOR: colorValidator({ default: "#78866b" }),
  DB_NAME: str({ default: "birthdaybot.db", testDefault: "birthdaybot.test.db" }),
  DB_PATH: str({ default: "./db" }),
  DEBUG: bool({ default: false, testDefault: true }),
  GUILD_ID: idValidator({ testDefault: fakeId }),
  LOGO_NAME: str({ default: "birthdaybot.webp" }),
  LOGO_PATH: str({ default: "./utils/images" }),
  LOGO_PORT: portValidator({ default: "random" }),
  LOGO_URL: url({ testDefault: fakeURL }),
  NAME: str({ default: "BirthdayBot" }),
  ROLE_ID: idValidator({ testDefault: fakeId }),
  TEST_FULL: bool({ default: false }),
  TOKEN: tokenValidator({ testDefault: fakeToken })
})

if (import.meta.main) {
  printVars(env, ["CHANNEL_ID", "GUILD_ID", "ROLE_ID", "TOKEN"])
}

export { env }
