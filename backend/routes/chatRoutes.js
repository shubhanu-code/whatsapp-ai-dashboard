const express = require("express");
const router = express.Router();

const {
  getChats
} = require("../services/chatService");

router.get("/", (req, res) => {
  res.json(getChats());
});
router.get("/conversations", (req, res) => {

  const chats = getChats();

  const conversations = {};

  chats.forEach(chat => {

    if (!conversations[chat.contactId]) {

      conversations[chat.contactId] = {
        contactId: chat.contactId,
        contactName:
          chat.contactName || "Unknown",
        lastMessage: chat.message,
        timestamp: chat.timestamp,
        messageCount: 1
      };

    } else {

      conversations[chat.contactId].lastMessage =
        chat.message;

      conversations[chat.contactId].timestamp =
        chat.timestamp;

      conversations[chat.contactId].messageCount += 1;

    }

  });

  res.json(
    Object.values(conversations)
  );

});

module.exports = router;