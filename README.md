﻿# Discord Music Bot

A powerful and flexible Discord bot designed for music playback, capable of streaming from various sources.

## Prerequisites

1. **Node.js and npm**: Ensure you have Node.js and npm installed. You can download and install them from (https://nodejs.org/).
2. **Discord Account**: Make sure you have a Discord account and are part of a Discord server where you have permission to add bots.
3. **Spotify Developer Account**: Sign up for a Spotify Developer account to obtain the necessary credentials.

## Step-by-Step Guide to Set Up Your Discord Music Bot

### Step 1: Clone the Repository

1. Open your terminal or command prompt.
2. Clone the repository:
   ```bash
   git clone https://github.com/uv547756/Discord-Bot.git

### Step 2: Install Dependencies

1. Navigate into the project directory.
2. Install the necesscary dependencies listed in `package.json`:
    ```bash
    npm install

### Configure the Bot

## Create a Discord Bot:
    1. Go to Discord Developer Portal (https://discord.com/developers/applications).
    2. Click "New Application" and give it a name.
    3. Under "Bot", click "Add Bot" and confirm.
    4. Copy the bot token and save it for later.

## Create a Spotify Application:
    1. Insure you have a Spotify Premium Membership for this to work.
    2. Go to Spotify Developer Dashboard (https://developer.spotify.com/dashboard).
    3. Click "Create an App" and fill in the necessary details.
    4. Obtain the `Client ID`, `Client Secret`, and set the `Redirect URI` (e.g., http://localhost:8888/callback).

## Create `config.json`:
1. In the root directory of your project, edit a file named `config_template.json` and rename it to `config.json`.
3. Replace the placeholders with your actual Discord bot token, Spotify client ID, client secret, and redirect URI.

## Step 4: Start the Bot
1. In the terminal, run the following command to start your bot:
```
node index.js
```
2. You should see a message saying "Bot is online!" in the terminal.

## Step 5: Invite the Bot to Your Server
1. Go back to the Discord Developer Portal and select your application.
2. Navigate to the "OAuth2" tab and under "OAuth2 URL Generator", select "bot"  in scopes and "Administrator" in bot permissions.
3. Copy the generated URL, paste it into your browser, and follow the instructions to invite the bot to your Discord server.

## Step 6: Use the Bot
In your Discord server, you can now use the bot commands:

`!play <song>`: Plays a song from Spotify by searching for it on YouTube.

`!stop`: Stops the current playback and disconnects the bot from the voice channel.

`!help`: Lists all available commands.

`!test`: Plays a test file (ensure the file path is correct).

## Troubleshooting
1. If the bot doesn’t respond, check the terminal for any error messages.
2. Ensure the bot has the necessary permissions to join and speak in the voice channel.
3. Verify that the Spotify API credentials are correct and the access token is being refreshed.
