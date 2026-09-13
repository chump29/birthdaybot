# ![BirthdayBot](./utils/images/birthdaybot.webp) BirthdayBot

> - BirthdayBot for Discord

---

![Bun](https://img.shields.io/badge/Bun-1.4.2-informational?style=plastic&logo=bun "Bun") &nbsp;
![discord.js](https://img.shields.io/badge/discord.js-^14.27.0-informational?style=plastic&logo=discord.js "discord.js") &nbsp; <!-- markdownlint-disable-line MD013 -->
![Drizzle](https://img.shields.io/badge/Drizzle-1.0.0--rc.4-informational?style=plastic&logo=drizzle "Drizzle") &nbsp;
![SQLite](https://img.shields.io/badge/SQLite-3.49.2-informational?style=plastic&logo=sqlite "SQLite")

![CodeQL](https://github.com/chump29/birthdaybot/workflows/CodeQL/badge.svg "CodeQL") &nbsp;
![Coverage](https://img.shields.io/badge/Coverage-86.28%25-success?style=plastic&logo=jest "Coverage")

![NO AI](https://img.shields.io/badge/NO-AI-orange?style=plastic "NO AI") &nbsp;
![License](https://img.shields.io/github/license/chump29/birthdaybot?style=plastic&color=blueviolet&label=License&logo=gplv3 "GPLv3")

---

### What it does: <!-- markdownlint-disable-line MD001 -->

- Wishes user a Happy Birthday at midnight

- Gives user a specific role for their birthday

---

### 🔗 Invite Link

[Add BirthdayBot](https://discord.com/oauth2/authorize?client_id=1507172799666458705&permissions=268453888&integration_type=0&scope=bot)

---

### 🖥️ Discord

#### Role Permissions:

| ⚙️ Permission |
|:-------------:|
|  EmbedLinks   |
|  ManageRoles  |
| SendMessages  |

#### Commands:

|       📋 Task       |        🔧 Command         | ⚙️ Permission |
|:-------------------:|:-------------------------:|:-------------:|
|    Add Birthday     | `/birthday <month> <day>` | SendMessages  |
|   Delete Birthday   |         `/delete`         | SendMessages  |
|        Info         |          `/info`          | SendMessages  |
| List All Birthdays  |          `/list`          | Administrator |
|        Ping         |          `/ping`          | SendMessages  |
|    Show Birthday    |          `/show`          | SendMessages  |
| Wish Happy Birthday |      `/wish <user>`       | Administrator |

---

### 🖧 Docker

#### Environment Variables:

| 📝 Description | 📌 Variable |    {...} Value     |
|:--------------:|:-----------:|:------------------:|
|   Channel ID   | CHANNEL_ID  |       \<id>        |
|  Embed Color   |    COLOR    | 78866b<sup>1</sup> |
|    DB Name     |   DB_NAME   |   birthdaybot.db   |
|    DB Path     |   DB_PATH   |       ./db/        |
|     Debug      |    DEBUG    |   true/**false**   |
|   Server ID    |  GUILD_ID   |       \<id>        |
|    Logo URL    |  LOGO_URL   |       \<url>       |
|    Bot Name    |    NAME     |    BirthdayBot     |
|    Role ID     |   ROLE_ID   |       \<id>        |
|   Bot Token    |    TOKEN    |      \<token>      |

###### <sup>1</sup> RRGGBB <!-- markdownlint-disable-line MD001 -->

##### From `@postfmly/logoserver`:

|  📝 Description   | 📌 Variable |    {...} Value    |
|:-----------------:|:-----------:|:-----------------:|
|     IPv4/IPv6     |  LOGO_IPv6  |  true/**false**   |
|     Logo Name     |  LOGO_NAME  |   soberbot.webp   |
|    Local Path     |  LOGO_PATH  |  ./utils/images   |
|       Port        |  LOGO_PORT  | **random**/[port] |
|    Logo 2 Name    | LOGO2_NAME  |    \<filename>    |
| Logo 2 Local Path | LOGO2_PATH  |      \<path>      |

##### From `@postfmly/checkrate`:

| 📝 Description | 📌 Variable | {...} Value |
|:--------------:|:-----------:|:-----------:|
|   Rate Limit   |    RATE     |     1s      |

#### Deployment:

|  📜 Script  |  🔧 Command   |
|:-----------:|:-------------:|
|    Full     | `./build.sh`  |
| Docker Only | `./docker.sh` |

---

### 📄 Documentation

### Generate:

```bash
./docs.sh
```

---

### 🛰️ Git & CI/CD

- **Pre-Commit:** Staged files are automatically linted
- **Github Actions:** Builds and pushes images to repository
  - latest
    - amd64
    - arm64
