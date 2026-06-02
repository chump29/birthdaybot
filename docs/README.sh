#!/usr/bin/env -S bash -e

echo -e "📌 Packages:\n"

_bun=$(bun --version)
bun pm pkg set packageManager="bun@$_bun" engines.bun="~$_bun" > /dev/null 2>&1
_bun=~$_bun
export _bun
echo -e " • Bun: $_bun"

_discord=$(jq -r '.dependencies."discord.js" // "❓"' ../package.json)
export _discord
echo -e " • discord.js: $_discord"

_drizzle=$(jq -r '.dependencies."drizzle-orm" // "❓"' ../package.json)
_drizzle=${_drizzle/-/--}
export _drizzle
echo -e " • drizzle-orm: ${_drizzle/--/-}"

_name=$(jq -r .name ../package.json)
if [[ "$HOSTNAME" == "guru" ]]; then
  docker context use nova > /dev/null 2>&1
fi
if [ "$(docker ps -q -f name="$_name")" ]; then
  _sqlite=$(docker exec "$_name" apk info sqlite | head -n 1 | cut -d " " -f 1)
  _sqlite=${_sqlite:7:-3}
else
  _sqlite=3.49.2
  _static="*"
fi
if [[ "$HOSTNAME" == "guru" ]]; then
  docker context use default > /dev/null 2>&1
fi
export _sqlite
echo -e " • SQLite: $_sqlite$_static"


if [ ! -f "../coverage/lcov.info" ]; then
  bun run test > /dev/null 2>&1
fi
_coverage=$(bun run lcov-total ../coverage/lcov.info)
export _coverage
echo -e "\n☂️  Coverage: $_coverage%"

echo -e "\n🛠️  Creating README.md..."

envsubst < README.template.md > ../README.md

echo -e "\n✔️  Done!\n"
