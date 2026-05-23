#!/usr/bin/env -S bash -e

_yellow="\e[4;93m"
_nc="\e[0m"
_build=📦
_start="▶️ "

echo -e "${_build} ${_yellow}Building${_nc}:\n"
./Dockerfile

echo -e "\n${_start} ${_yellow}Starting${_nc}:\n"
docker container rm --force birthdaybot > /dev/null 2>&1
docker container run --rm --name birthdaybot --publish 8007:8007 --env TZ=America/Chicago --detach birthdaybot
