const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const { NewMessage } = require("telegram/events");
const { Api } = require("telegram");

require("dotenv").config();

// Main configuration
const CONFIG = {
  telegram: {
    apiId: Number(process.env.TELEGRAM_API_ID),
    apiHash: process.env.TELEGRAM_API_HASH,
    phoneNumber: process.env.TELEGRAM_PHONE_NUMBER,
    session: new StringSession(""),
  },
  channels: {
    source: [BigInt(process.env.SOURCE_CHANNEL_ID_1)],
    target: BigInt(process.env.TARGET_CHANNEL_ID),
  },
  heartbeatInterval: 300000, // 5 minutes
};

async function main() {
  // Initialize client
  console.log("Starting Telegram client...");
  const client = new TelegramClient(
    CONFIG.telegram.session,
    CONFIG.telegram.apiId,
    CONFIG.telegram.apiHash,
    { connectionRetries: 5 }
  );

  // Start client with authentication
  await client.start({
    phoneNumber: async () => CONFIG.telegram.phoneNumber,
    password: async () => await input.text("Password: "),
    phoneCode: async () => await input.text("Code: "),
    onError: (err) => console.error(err),
  });

  // Save session string
  console.log("Session string:", client.session.save());

  // Set up message handler
  client.addEventHandler(async (event) => {
    const message = event.message;

    try {
      console.log("\n------------------------");
      console.log(
        "New message received at:",
        new Date(message.date * 1000).toLocaleString()
      );

      // Temporarily disable forward restriction
      await client.invoke(
        new Api.messages.ToggleNoForwards({
          peer: await client.getInputEntity(message.peerId),
          enabled: false,
        })
      );

      // Forward message to target channel
      await client.forwardMessages(CONFIG.channels.target, {
        messages: message.id,
        fromPeer: message.peerId,
      });

      // Re-enable forward restriction
      await client.invoke(
        new Api.messages.ToggleNoForwards({
          peer: await client.getInputEntity(message.peerId),
          enabled: true,
        })
      );

      console.log("Message forwarded successfully");
      console.log("------------------------");
    } catch (err) {
      console.error("Error handling message:", err);
    }
  }, new NewMessage({ chats: CONFIG.channels.source }));

  // Log startup status
  console.log("\nBot is running...");
  console.log("Forwarding messages from source channel to target channel");
  console.log("Press Ctrl+C to stop.");

  // Heartbeat
  setInterval(() => {
    console.log("Still running...", new Date().toLocaleString());
  }, CONFIG.heartbeatInterval);

  // Keep alive
  await new Promise(() => {});
}

// Start the bot
main().catch((err) => console.error("Fatal error:", err));
