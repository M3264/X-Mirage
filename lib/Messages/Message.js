const {
  decodeJid,
  createInteractiveMessage,
  parsedJid,
} = require("../functions");
const Base = require("./Base");
const { writeExifWebp } = require("../sticker");
const config = require("../../config");
const ReplyMessage = require("./ReplyMessage");
const fileType = require("file-type");
const {
  generateWAMessageFromContent,
  generateForwardMessageContent,
  generateWAMessage,
} = require("@whiskeysockets/baileys");

class Message extends Base {
  constructor(client, data) {
    super(client);
    if (data) this._patch(data);
  }

  _patch(data) {
    this.user = decodeJid(this.client.user.id);
    this.key = data.key;
    this.isGroup = data.isGroup;
    this.prefix = data.prefix;
    this.id = data.key.id;
    this.jid = data.key.remoteJid;
    this.message = { key: data.key, message: data.message };
    this.pushName = data.pushName;
    this.participant = parsedJid(data.sender)[0];
    try {
      this.sudo = config.SUDO.split(",").includes(
        this.participant.split("@")[0]
      );
    } catch {
      this.sudo = false;
    }
    this.text = data.body;
    this.fromMe = data.key.fromMe;
    this.isBaileys = this.id.startsWith("BAE5");
    this.timestamp = data.messageTimestamp.low || data.messageTimestamp;
    const contextInfo = data.message.extendedTextMessage?.contextInfo;
    this.mention = contextInfo?.mentionedJid || false;
    if (data.quoted) {
      if (data.message.buttonsResponseMessage) return;
      this.reply_message = new ReplyMessage(this.client, contextInfo, data);
      const quotedMessage = data.quoted.message.extendedTextMessage;
      this.reply_message.type = data.quoted.type || "extendedTextMessage";
      this.reply_message.mtype = data.quoted.mtype;
      this.reply_message.key = data.quoted.key;
      this.reply_message.mention =
        quotedMessage?.contextInfo?.mentionedJid || false;
    } else {
      this.reply_message = false;
    }

    return super._patch(data);
  }

  async sendReply(text, opt = {}) {
    return this.client.sendMessage(
      this.jid,
      { text },
      { ...opt, quoted: this }
    );
  }

  async log() {
    console.log(this.data);
  }

  async sendFile(content, options = {}) {
    const { data } = await this.client.getFile(content);
    const type = (await fileType.fromBuffer(data)) || {};
    return this.client.sendMessage(
      this.jid,
      { [type.mime.split("/")[0]]: data },
      options
    );
  }

  async edit(text, opt = {}) {
    await this.client.sendMessage(this.jid, { text, edit: this.key, ...opt });
  }

  async reply(text, opt = {}) {
    return this.client.sendMessage(
      this.jid,
      { text, ...opt },
      { ...opt, quoted: this }
    );
  }

  async send(jid, text, opt = {}) {
    const recipient = jid.endsWith("@s.whatsapp.net") ? jid : this.jid;
    return this.client.sendMessage(recipient, { text, ...opt });
  }

  async sendMessage(
    jid,
    content,
    opt = { packname: "Xmirage", author: "M3264", fileName: "X-Mirage" },
    type = "text"
  ) {
    switch (type.toLowerCase()) {
      case "text":
        return this.client.sendMessage(jid, { text: content, ...opt });
      case "image" || "photo":
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(jid, { image: content, ...opt });
        } else if (isUrl(content)) {
          return this.client.sendMessage(jid, {
            image: { url: content },
            ...opt,
          });
        }
        break;
      case "video":
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(jid, { video: content, ...opt });
        } else if (isUrl(content)) {
          return this.client.sendMessage(jid, {
            video: { url: content },
            ...opt,
          });
        }
        break;
      case "audio":
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(jid, { audio: content, ...opt });
        } else if (isUrl(content)) {
          return this.client.sendMessage(jid, {
            audio: { url: content },
            ...opt,
          });
        }
        break;
      case "template":
        const optional = await generateWAMessage(jid, content, opt);
        const message = {
          viewOnceMessage: {
            message: {
              ...optional.message,
            },
          },
        };
        await this.client.relayMessage(jid, message, {
          messageId: optional.key.id,
        });
        break;
      case "interactive":
        const genMessage = createInteractiveMessage(content);
        await this.client.relayMessage(jid, genMessage.message, {
          messageId: genMessage.key.id,
        });
        break;
      case "sticker":
        const { data, mime } = await this.client.getFile(content);
        if (mime == "image/webp") {
          const buff = await writeExifWebp(data, opt);
          await this.client.sendMessage(
            jid,
            { sticker: { url: buff }, ...opt },
            opt
          );
        } else {
          const mimePrefix = mime.split("/")[0];
          if (mimePrefix === "video" || mimePrefix === "image") {
            await this.client.sendImageAsSticker(this.jid, content, opt);
          }
        }
        break;
      case "document":
        if (!opt.mimetype) throw new Error("Mimetype is required for document");
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(jid, { document: content, ...opt });
        } else if (isUrl(content)) {
          return this.client.sendMessage(jid, {
            document: { url: content },
            ...opt,
          });
        }
        break;
    }
  }

  async forward(jid, content, options = {}) {
    if (options.readViewOnce) {
      content = content?.ephemeralMessage?.message || content;
      const viewOnceKey = Object.keys(content)[0];
      delete content?.ignore;
      delete content?.viewOnceMessage?.message?.[viewOnceKey]?.viewOnce;
      content = { ...content?.viewOnceMessage?.message };
    }

    if (options.mentions) {
      content[getContentType(content)].contextInfo.mentionedJid =
        options.mentions;
    }

    const forwardContent = generateForwardMessageContent(content, false);
    const contentType = getContentType(forwardContent);

    const forwardOptions = {
      ptt: options.ptt,
      waveform: options.audiowave,
      seconds: options.seconds,
      fileLength: options.fileLength,
      caption: options.caption,
      contextInfo: options.contextInfo,
    };

    if (options.mentions) {
      forwardOptions.contextInfo.mentionedJid = options.mentions;
    }

    if (contentType !== "conversation") {
      forwardOptions.contextInfo =
        content?.message[contentType]?.contextInfo || {};
    }

    forwardContent[contentType].contextInfo = {
      ...forwardOptions.contextInfo,
      ...forwardContent[contentType]?.contextInfo,
    };

    const waMessage = generateWAMessageFromContent(jid, forwardContent, {
      ...forwardContent[contentType],
      ...forwardOptions,
    });
    return await client.relayMessage(jid, waMessage.message, {
      messageId: waMessage.key.id,
    });
  }

  async PresenceUpdate(status) {
    await sock.sendPresenceUpdate(status, this.jid);
  }

  async delete(key) {
    await this.client.sendMessage(this.jid, { delete: key });
  }

  async updateName(name) {
    await this.client.updateProfileName(name);
  }

  async getPP(jid) {
    return await this.client.profilePictureUrl(jid, "image");
  }

  async setPP(jid, pp) {
    const profilePicture = Buffer.isBuffer(pp) ? pp : { url: pp };
    await this.client.updateProfilePicture(jid, profilePicture);
  }

  async block(jid) {
    await this.client.updateBlockStatus(jid, "block");
  }

  async unblock(jid) {
    await this.client.updateBlockStatus(jid, "unblock");
  }

  async add(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "add");
  }

  async kick(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "remove");
  }

  async promote(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "promote");
  }

  async demote(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "demote");
  }
}

module.exports = Message;
