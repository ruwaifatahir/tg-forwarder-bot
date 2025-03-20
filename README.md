# Telegram Message Forwarder Bot

A Telegram bot that monitors source channels for specific keywords and forwards modified messages to a target channel using AI.

## Prerequisites

- Node.js (v16 or higher)
- Telegram API credentials (API ID and Hash)
- Google Gemini API key
- Source and target channel IDs
- Membership in source channels and admin rights in target channel

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file and copy the contents from `.env.example` and fill in the values:

```
cp .env.example .env
```

3. Run the bot:

```bash
npm start
```

### How to get credentials:

1. **Telegram API Credentials**:

   - Visit https://my.telegram.org/auth
   - Go to 'API development tools'
   - Create a new application
   - Copy API ID and API Hash

2. **Channel IDs**:

   - Forward a message from the channel to @username_to_id_bot
   - Use the numeric ID (including the minus sign)
   - For multiple source channels, create new variable for each source channel id and update `index.js` to include it in `CONFIG.channels.source`

3. **Google Gemini API Key**:
   - Visit https://makersuite.google.com/app/apikey
   - Create a new API key

## Authentication

There are two ways to authenticate with Telegram:

### 1. Interactive Login (First Time Setup)

When you run the bot for the first time without a session string:

1. Enter your phone number
2. Input the verification code sent to your Telegram
3. Enter your 2FA password if enabled
4. The bot will display a session string - save this for future use

### 2. Session String Authentication (Recommended)

To avoid entering codes and passwords every time:

1. After your first successful login, copy the session string that is displayed
2. Add it to your `.env` file as `TELEGRAM_SESSION=your_session_string`
3. **Important**: The session string might contain whitespace - use [this tool](https://www.browserling.com/tools/remove-all-whitespace) to remove any whitespace before adding it to `.env`
4. Make sure the session string is on a single line in the `.env` file

## Usage

1. Start the bot:

```bash
npm start
```

2. Authentication:
   - If you have a valid session string in `.env`, the bot will connect automatically
   - If no session string is present, follow the interactive login steps
   - **Important**: Ensure you are:
     - A member of all source channels you want to monitor
     - An administrator in the target channel where messages will be forwarded

The bot will now:

- Monitor specified source channels
- Forward messages containing keywords
- Modify messages using AI before forwarding
- Send to the target channel

## Keywords

Default keywords are configured in `index.js`:

- crypto
- bitcoin
- eth

Modify the `keywords` array in the CONFIG object to customize.
