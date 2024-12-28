const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const { NewMessage } = require("telegram/events");

// Configuration
const CONFIG = {
  telegram: {
    apiId: 25871754,
    apiHash: "d61fca1e0b08e8c05c66194f0c1198c2",
    phoneNumber: "+923144254044",
    session: new StringSession(""),
  },
  channels: {
    source: [
      BigInt("-1002375001807"), // Bot testing
    ],
    target: BigInt("-4690318011"),
  },
  heartbeatInterval: 300000, // 5 minutes
};

// Utility functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logger = {
  info: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  divider: () => console.log("\n------------------------"),
};

// Channel management functions
async function getChannelInfo(client, channelId) {
  try {
    const entity = await client.getEntity(channelId);
    logger.info("Channel found:", {
      id: entity.id.toString(),
      title: entity.title,
      isChannel: entity.className === "Channel",
    });
    return entity;
  } catch (err) {
    logger.error(`Failed to get channel info for ${channelId}:`, err.message);
    return null;
  }
}

async function listAllChannels(client) {
  try {
    const dialogs = await client.getDialogs();
    console.log("\nAvailable channels/chats:");
    dialogs.forEach((dialog) => {
      if (dialog.isChannel) {
        console.log({
          title: dialog.title,
          id: dialog.id.toString(),
          isChannel: dialog.isChannel,
        });
      }
    });
  } catch (err) {
    console.error("Error fetching dialogs:", err);
  }
}

// Message handling
async function forwardMessage(client, message, sender) {
  try {
    await client.forwardMessages(CONFIG.channels.target, {
      messages: [message.id],
      fromPeer: message.peerId,
    });
    return true;
  } catch (forwardError) {
    logger.error("Forward failed, attempting to send as new message");
    return await sendAsNewMessage(client, message, sender);
  }
}

async function sendAsNewMessage(client, message, sender) {
  try {
    const messageText = `
🔄 Forwarded from: ${message.chat.title}
👤 Original sender: ${sender?.firstName || "Unknown"}
📝 Message:
${message.text}`;

    await client.sendMessage(CONFIG.channels.target, {
      message: messageText,
      ...(message.media && { media: message.media }),
    });
    return true;
  } catch (err) {
    logger.error("Failed to send as new message:", err.message);
    return false;
  }
}

// Client setup and initialization
async function initializeClient() {
  const client = new TelegramClient(
    CONFIG.telegram.session,
    CONFIG.telegram.apiId,
    CONFIG.telegram.apiHash,
    { connectionRetries: 5 }
  );

  await client.start({
    phoneNumber: async () => CONFIG.telegram.phoneNumber,
    password: async () => await input.text("Password: "),
    phoneCode: async () => await input.text("Code: "),
    onError: (err) => logger.error(err),
  });

  const savedSession = client.session.save();
  logger.info("Session string:", savedSession);

  return client;
}

async function setupMessageHandler(client, validChannels) {
  client.addEventHandler(async (event) => {
    const message = event.message;
    try {
      const sender = await message.getSender();

      logger.divider();
      logger.info("New message:", {
        channel: message.chat?.title || "Unknown",
        sender: sender?.firstName || "Unknown",
        message: message.text,
        date: new Date(message.date * 1000).toLocaleString(),
        mediaType: message.media?.className,
      });

      await delay(1000);
      const success = await forwardMessage(client, message, sender);
      logger.info(
        success ? "Message handled successfully" : "Failed to handle message"
      );
      logger.divider();
    } catch (err) {
      logger.error("Error processing message:", err);
    }
  }, new NewMessage({ chats: validChannels }));
}

// Main execution
async function main() {
  logger.info("Starting Telegram client...");
  const client = await initializeClient();

  await listAllChannels(client);

  const validChannels = [];
  for (const channel of CONFIG.channels.source) {
    const channelInfo = await getChannelInfo(client, channel);
    if (channelInfo) validChannels.push(channel);
  }

  if (validChannels.length === 0) {
    throw new Error("No valid channels found");
  }

  const targetChannel = await getChannelInfo(client, CONFIG.channels.target);
  if (!targetChannel) {
    throw new Error("Cannot access target channel");
  }

  await setupMessageHandler(client, validChannels);

  logger.info(`\nMonitoring ${validChannels.length} channels...`);
  logger.info(`Forwarding to: ${targetChannel.title}`);
  logger.info("\nListening for messages... Press Ctrl+C to stop.");

  setInterval(() => {
    logger.info("Still listening...", new Date().toLocaleString());
  }, CONFIG.heartbeatInterval);

  // Keep alive
  await new Promise(() => {});
}

// Error handling
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled promise rejection:", err);
});

main().catch((err) => {
  logger.error("Unexpected error:", err);
});
