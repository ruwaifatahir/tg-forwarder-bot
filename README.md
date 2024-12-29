# Telegram Message Forwarder Bot

A Telegram bot that monitors source channels for specific keywords and forwards modified messages to a target channel using AI.

## Prerequisites

- Node.js (v16 or higher)
- Telegram API credentials (API ID and Hash)
- Google Gemini API key
- Source and target channel IDs

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

## Usage

1. Start the bot:

```bash
npm start
```


2. First time setup:
   - Enter your phone number
   - Input the verification code sent to your Telegram
   - Optionally enter your 2FA password if enabled

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
