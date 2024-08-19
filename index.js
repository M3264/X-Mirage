const fs = require("fs").promises;
const path = require("path");
const config = require("./config");
const connect = require("./lib/connection");
const { loadSession } = require("@whiskeysockets/baileys");
const io = require("socket.io-client");
const { getandRequirePlugins } = require("./assets/database/plugins");

global.__basedir = __dirname; // Set the base directory for the project

const readAndRequireFiles = async (directory) => {
  try {
    const files = await fs.readdir(directory);
    return Promise.all(
      files
        .filter((file) => path.extname(file).toLowerCase() === ".js")
        .map((file) => require(path.join(directory, file)))
    );
  } catch (error) {
    console.error("Error reading and requiring files:", error);
    throw error;
  }
};

async function initialize() {
  console.log("X-Mirage");
  try {
    const credsPath = path.join(__dirname, '/session/creds.json');
    const sessionDir = path.join(__dirname, '/session');

    // Check if creds.json exists
    try {
      await fs.access(credsPath);
      console.log("creds.json already exists, skipping session load.");
    } catch (err) {
      console.log("creds.json not found, checking session ID...");

      if (config.SESSION_ID) {
        // Check if the session directory exists, create it if it doesn't
        try {
          await fs.access(sessionDir);
        } catch (err) {
          await fs.mkdir(sessionDir);
        }

        console.log("loading session from session id...");
        const credsData = await loadSession(config.SESSION_ID);
        await fs.writeFile(credsPath, JSON.stringify(credsData.creds, null, 2));
      }
    }

    await readAndRequireFiles(path.join(__dirname, "/assets/database/"));
    console.log("Syncing Database");

    await config.DATABASE.sync();

    console.log("⬇  Installing Plugins...");
    await readAndRequireFiles(path.join(__dirname, "/assets/plugins/"));
    await getandRequirePlugins();
    console.log("✅ Plugins Installed!");
    return await connect();

  } catch (error) {
    console.error("Initialization error:", error);
    return process.exit(1); // Exit with error status
  }
}

initialize();
