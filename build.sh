#!/usr/bin/env -S bash -e

_red="\e[4;91m"
_green="\e[4;92m"
_yellow="\e[4;93m"
_nc="\e[0m"
_title=✨
_task="🛠️ "
_lint=🔍
_test=🧪
_done="✔️ "

clear

echo -e "${_title} ${_red}BirthdayBot${_nc} ${_title}\n"

echo -e "${_task} ${_yellow}Installing dependencies${_nc}:\n"
bun install --frozen-lockfile

echo -e "\n${_lint} ${_yellow}Linting${_nc}:\n"
bun run lint

echo -e "\n${_test} ${_yellow}Testing${_nc}:\n"
bun run test:coverage

./docker.sh

echo -e "\n${_done} ${_green}Done${_nc}!\n"
