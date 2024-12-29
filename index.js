const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const { NewMessage } = require("telegram/events");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
  heartbeatInterval: 300000,
  keywords: ["crypto", "bitcoin", "eth"],
  prompt:
    "Please rewrite this message in a different way while keeping the same meaning. and only provide exact one message that I can forward to my group.",
};

async function main() {
  // Initialize AI model
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
      // Log new message
      console.log("\n------------------------");
      console.log("New message received:", {
        message: message.text,
        date: new Date(message.date * 1000).toLocaleString(),
      });

      // Check keywords
      const hasKeyword =
        message.text &&
        CONFIG.keywords.some((keyword) =>
          message.text.toLowerCase().includes(keyword.toLowerCase())
        );

      if (!hasKeyword) {
        console.log("Message filtered: No matching keywords");
        return;
      }

      // Generate modified message using AI
      try {
        const result = await model.generateContent(
          `Original message: "${message.text}" "${CONFIG.prompt}"`
        );
        const modifiedText = await result.response.text();

        // Send modified message
        await client.sendMessage(CONFIG.channels.target, {
          message: modifiedText,
          ...(message.media && { media: message.media }),
        });
        console.log("Message forwarded successfully");
      } catch (err) {
        console.error("Error processing message:", err.message);
      }

      console.log("------------------------");
    } catch (err) {
      console.error("Error handling message:", err);
    }
  }, new NewMessage({ chats: CONFIG.channels.source }));

  // Log startup status
  console.log("\nBot is running...");
  console.log("Monitoring source channels for keywords:", CONFIG.keywords);
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
