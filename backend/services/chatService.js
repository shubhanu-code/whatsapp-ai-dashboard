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

  chats = getChats();

  chats.push({
    ...message,
    read: message.read ?? false
  });

  saveChats(chats);

}

function deleteChat(contactId) {
  const chats = getChats();

  const filtered = chats.filter(
    chat => chat.contactId !== contactId
  );

  saveChats(filtered);
}

module.exports = {
  getChats,
  addMessage,
  deleteChat,
  saveChats
};