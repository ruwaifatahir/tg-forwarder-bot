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
    session: new StringSession(process.env.TELEGRAM_SESSION || ""),
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
    {
      connectionRetries: 5,
      useWSS: true,
      useIPV6: false,
      timeout: 10,
      requestRetries: 5,
      floodSleepThreshold: 60,
      deviceModel: "Desktop",
      systemVersion: "Windows 10",
      appVersion: "1.0.0",
      langCode: "en",
    }
  );

  try {
    // Connect using existing session
    await client.connect();

    // Only do interactive login if we don't have a session
    if (!process.env.TELEGRAM_SESSION) {
      await client.start({
        phoneNumber: async () => CONFIG.telegram.phoneNumber,
        password: async () => await input.text("Please enter your password: "),
        phoneCode: async () =>
          await input.text("Please enter the code you received: "),
        onError: (err) => console.error(err),
      });
      console.log(
        "Save this session string in your .env file as TELEGRAM_SESSION:"
      );
      console.log(client.session.save());
    }

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
  } catch (err) {
    console.error("Fatal error:", err);
  }
}

// Start the bot
main().catch((err) => console.error("Fatal error:", err));
