const {
  FiletypeFromUrl,
  parseJid,
  extractUrlFromMessage,
} = require("./functions");
const { getStatus, getMessage } = require("../assets/database").Greetings;

async function Greetings(data, conn) {
  try {
    const metadata = await conn.groupMetadata(data.id);
    const participants = data.participants;

    for (const user of participants) {
      const userpp = await getUserProfilePicture(conn, user);

      switch (data.action) {
        case "add":
          await handleGroupAction(conn, data.id, metadata, user, userpp, "welcome");
          break;
        case "remove":
          await handleGroupAction(conn, data.id, metadata, user, userpp, "goodbye");
          break;
      }
      
      // Rate limiting: Wait for a short delay to avoid triggering rate limit
      await delay(1000); // Adjust the delay time as needed
    }
  } catch (error) {
    console.error("Error handling greetings:", error);
    // Handle specific errors like rate-overlimit or log the error for debugging
  }
}

async function getUserProfilePicture(conn, user) {
  try {
    return await conn.profilePictureUrl(user, "image");
  } catch {
    return "https://getwallpapers.com/wallpaper/full/3/5/b/530467.jpg";
  }
}

async function handleGroupAction(conn, groupId, metadata, user, userpp, actionType) {
  const status = await getStatus(groupId, actionType);
  if (!status) return;

  const message = await getMessage(groupId, actionType);
  let msg = replaceMessagePlaceholders(message.message, user, metadata);

  const url = extractUrlFromMessage(msg);

  try {
    if (url) {
      const { type, buffer } = await FiletypeFromUrl(url);

      if (type === "image" || type === "video") {
        const caption = msg.replace(url, "").trim();

        await conn.sendMessage(groupId, {
          [type]: buffer,
          caption,
          mentions: parseJid(msg),
        });
      } else {
        await conn.sendMessage(groupId, { text: msg, mentions: parseJid(msg) });
      }
    } else {
      await conn.sendMessage(groupId, { text: msg, mentions: parseJid(msg) });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    // Handle specific message sending errors if needed
  }
}

function replaceMessagePlaceholders(message, user, metadata) {
  return message
    .replace(/@user/gi, `@${user.split("@")[0]}`)
    .replace(/@gname/gi, metadata.subject)
    .replace(/@count/gi, metadata.participants.length);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = Greetings;