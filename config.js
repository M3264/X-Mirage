const { Sequelize } = require("sequelize");
const fs = require("fs");
require("dotenv").config();
const toBool = (x) => x === "true";
const DATABASE_URL = process.env.DATABASE_URL || "./assets/database.db";
module.exports = {
  ANTILINK: toBool(process.env.ANTI_LINK) || false,
  LOGS: toBool(process.env.LOGS) || true,
  ANTILINK_ACTION: process.env.ANTI_LINK || "kick",
  SESSION_ID: process.env.SESSION_ID || "",
  LANG: process.env.LANG || "EN",
  AUTH_TOKEN: "",
  HANDLERS:
    process.env.HANDLER === "false" || process.env.HANDLER === "null"
      ? "^"
      : "[.]",
  RMBG_KEY: process.env.RMBG_KEY || false,
  BRANCH: "main",
  WARN_COUNT: 3,
  PACKNAME: process.env.PACKNAME || "XMirage",
  WELCOME_MSG: process.env.WELCOME_MSG || "Hi @user Welcome to @gname",
  GOODBYE_MSG: process.env.GOODBYE_MSG || "Hi @user It was Nice Seeing you",
  AUTHOR: process.env.AUTHOR || "XMirage",
  SUDO:
    process.env.SUDO || "2347013159244,2348160247341",
  HEROKU_APP_NAME: process.env.HEROKU_APP_NAME || "",
  HEROKU_API_KEY: process.env.HEROKU_API_KEY || "",
  OWNER_NAME: process.env.OWNER_NAME || "Mirage_Tech",
  HEROKU: toBool(process.env.HEROKU) || false,
  BOT_NAME: process.env.BOT_NAME || "X-Mirage",
  AUTO_READ: toBool(process.env.AUTO_READ) || false,
  AUTO_STATUS_READ: toBool(process.env.AUTO_STATUS_READ) || true,
  PROCESSNAME: process.env.PROCESSNAME || "x-mirage",
  WORK_TYPE: process.env.WORK_TYPE || "public",
  SESSION_URL: process.env.SESSION_URL || "",
  DELETED_LOG: toBool(process.env.DELETED_LOG) || false,
  DELETED_LOG_CHAT: process.env.DELETED_LOG_CHAT || false,
  REMOVEBG: process.env.REMOVEBG || false,
  DATABASE_URL: "postgresql://miracle32669_outlook:PbkUOk85gTwksHFhEbFt6A@puddle-meerkat-15347.8nj.gcp-europe-west1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full",
  STATUS_SAVER: toBool(process.env.STATUS_SAVER) || false,
  DATABASE:
    DATABASE_URL === "./assets/database.db"
      ? new Sequelize({
          dialect: "sqlite",
          storage: DATABASE_URL,
          logging: false,
        })
      : new Sequelize(DATABASE_URL, {
          dialect: "postgres",
          ssl: true,
          protocol: "postgres",
          dialectOptions: {
            native: true,
            ssl: { require: true, rejectUnauthorized: false },
          },
          logging: false,
        }),
};
