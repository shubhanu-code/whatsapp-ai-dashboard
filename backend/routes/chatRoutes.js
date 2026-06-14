const express = require("express");
const router = express.Router();

const {
  getChats,
  addMessage
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
router.get("/:contactId", (req, res) => {

  const chats = getChats();

  const messages = chats.filter(
    chat =>
      chat.contactId === req.params.contactId
  );

  res.json(messages);

});

router.post("/send", async (req, res) => {

  try {

    const { contactId, message } =
      req.body;

    if (!contactId || !message) {

      return res.status(400).json({
        error: "Missing fields"
      });

    }

    await global.waClient.sendMessage(
      contactId,
      message
    );

    addMessage({
      id: Date.now().toString(),
      contactId,
      contactName: contactId,
      message,
      direction: "outgoing",
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});

module.exports = router;