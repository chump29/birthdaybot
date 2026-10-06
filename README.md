# ![BirthdayBot](./utils/images/birthdaybot.webp) BirthdayBot

> - BirthdayBot for Discord

---

![Bun](https://img.shields.io/badge/Bun-1.4.2-informational?style=plastic&logo=bun "Bun") &nbsp;
![discord.js](https://img.shields.io/badge/discord.js-^14.27.0-informational?style=plastic&logo=discord.js "discord.js") &nbsp; <!-- markdownlint-disable-line MD013 -->
![Drizzle](https://img.shields.io/badge/Drizzle-1.0.0--rc.4-informational?style=plastic&logo=drizzle "Drizzle") &nbsp;
![SQLite](https://img.shields.io/badge/SQLite-3.49.2-informational?style=plastic&logo=sqlite "SQLite")

![CodeQL](https://github.com/chump29/birthdaybot/workflows/CodeQL/badge.svg "CodeQL") &nbsp;
![Coverage](https://img.shields.io/badge/Coverage-86.2%25-success?style=plastic&logo=jest "Coverage")

![NO AI](https://img.shields.io/badge/NO-AI-orange?style=plastic "NO AI") &nbsp;
![License](https://img.shields.io/github/license/chump29/birthdaybot?style=plastic&color=blueviolet&label=License&logo=gplv3 "GPLv3") &nbsp; <!-- markdownlint-disable MD013 -->
![CVE Scan](https://img.shields.io/badge/CVE%20Scan-Pass-success?style=plastic&logo=owasp "CVE Scan")

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

|       📋 Task       |        🔧 Command         | ⚙️ Member Permission |
|:-------------------:|:-------------------------:|:--------------------:|
|    Add Birthday     | `/birthday <month> <day>` |         None         |
|   Delete Birthday   |         `/delete`         |         None         |
|        Info         |          `/info`          |         None         |
| List All Birthdays  |          `/list`          |    Administrator     |
|        Ping         |          `/ping`          |         None         |
|    Show Birthday    |          `/show`          |         None         |
| Wish Happy Birthday |      `/wish <user>`       |    Administrator     |

---

### 🖧 Docker

#### Environment Variables:

|     📝 Description      | 📌 Variable |  {...} Value   |
|:-----------------------:|:-----------:|:--------------:|
|        Activity         |  ACTIVITY   |    Partying    |
|       Channel ID        | CHANNEL_ID  |     \<id>      |
| Embed Color<sup>1</sup> |    COLOR    |    #78866b     |
|         DB Name         |   DB_NAME   | birthdaybot.db |
|         DB Path         |   DB_PATH   |     ./db/      |
|          Debug          |    DEBUG    | true/**false** |
|        Server ID        |  GUILD_ID   |     \<id>      |
|        Bot Name         |    NAME     |  BirthdayBot   |
|         Role ID         |   ROLE_ID   |     \<id>      |
|        Bot Token        |    TOKEN    |    \<token>    |

###### <sup>1</sup> #RRGGBB format <!-- markdownlint-disable-line MD001 -->

##### From `@postfmly/logoserver`:

|  📝 Description   | 📌 Variable |    {...} Value    |
|:-----------------:|:-----------:|:-----------------:|
|     Logo Name     |  LOGO_NAME  | birthdaybot.webp  |
|    Local Path     |  LOGO_PATH  |  ./utils/images   |
|       Port        |  LOGO_PORT  | **random**/[port] |
|     Logo URL      |  LOGO_URL   |      \<url>       |
|    Logo 2 Name    | LOGO2_NAME  |   birthday.webp   |
| Logo 2 Local Path | LOGO2_PATH  |  ./utils/images   |
|    Logo 2 URL     |  LOGO2_URL  |      \<url>       |

##### From `@postfmly/checkrate`:

###### *NOTE: Rate limited to 1 request per 1 second*

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
