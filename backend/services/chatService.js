const fs = require("fs");
const path = require("path");

const CHAT_FILE = path.join(
  __dirname,
  "..",
  "data",
  "chats.json"
);

function getChats() {
  try {
    return JSON.parse(
      fs.readFileSync(CHAT_FILE, "utf8")
    );
  } catch {
    return [];
  }
}

function saveChats(chats) {
  fs.writeFileSync(
    CHAT_FILE,
    JSON.stringify(chats, null, 2)
  );
}

function addMessage(message) {
  const chats = getChats();

  chats.push(message);

  saveChats(chats);
}

module.exports = {
  getChats,
  addMessage
};