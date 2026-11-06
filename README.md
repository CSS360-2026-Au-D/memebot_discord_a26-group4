# Gracous Badger v1.0

> Discord bot Gracious Badger is a card game bot that allows for single and multiplayer games of Poker and Blackjack to be played in discord.

Built for CSS 360 by the Gracious Badgers group.

---

## Features

- **Poker** – the card game poker
- **Blackjack** – the card game blackjack
- **XP** – experience for keeping track how much a user plays

<!-- Optional: add a screenshot or GIF of the bot in action -->
<!-- ![Demo](docs/demo.gif) -->

## Commands

| Command | Description | Example |
|---|---|---|
| `/command <arg>` | Describe what it does | `/command hello` |

## Tech Stack

- **Language:** Javascript
- **Library:** [discord.js](https://discord.js.org/)
- **Hosting:** Local only

## Getting Started

### 1. Create the Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. Under **Bot**, click **Reset Token** and copy the token. **Never commit this token.**
3. Under **Bot → Privileged Gateway Intents**, enable any intents the bot needs (e.g., **Message Content Intent** if it reads message text).
4. Under **OAuth2 → URL Generator**, select the `bot` and `applications.commands` scopes, choose the required permissions, and open the generated URL to invite the bot to your server.

### 2. Clone and Install

```bash
git clone https://github.com/SunnyPearl2006/memebot_discord_a26-group4
cd memebot_discord_a26-group4
```

### 3. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```.env
DISCORD_TOKEN=your-bot-token-here
GUILD_ID=your-test-server-id  
```

Make sure `.env` is listed in `.gitignore`.

### 4. Run the Bot

```bash
npm start
```

If everything is set up correctly, the bot should appear online in your server

## Project Structure

```
Add in final structure.
```

## Team

| Name | GitHub | Role / Responsibilities |
|---|---|---|
| Harrison | [@Suspicious-Wizard](https://github.com/Suspicious-Wizard/discord_bot-gracious_badgers) | Game designer |
| Juan | [@username](https://github.com/username) | Game designer |
| Shiv | [@username](https://github.com/username) | Database management |
| Kevin | [@username](https://github.com/username) | Slash commands and interface |

## Roadmap

- [ ] Basic bot setup and `/ping`
- [ ] XP
- [ ] BlackJack
- [ ] Poker
