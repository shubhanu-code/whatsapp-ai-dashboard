const express = require("express");
const router = express.Router();

const {
  getChats,
  addMessage,
  saveChats
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
        messageCount: 1,
        unreadCount:
          chat.direction === "incoming" &&
          !chat.read
            ? 1
            : 0,
        pinned: chat.pinned || false,
        favorite:
          chat.favorite || false,
      };

    } else {

      conversations[chat.contactId].lastMessage =
        chat.message;

      conversations[chat.contactId].timestamp =
        chat.timestamp;

      conversations[chat.contactId].messageCount += 1;

      if (
        chat.direction === "incoming" &&
        !chat.read
      ) {
        conversations[
          chat.contactId
        ].unreadCount += 1;
      }

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
router.post(
  "/pin/:contactId",
  (req, res) => {
    console.log(
      "PIN ROUTE HIT:",
      req.params.contactId
    );
    const chats = getChats();

    const updated = chats.map(chat => {

      if (
        chat.contactId ===
        req.params.contactId
      ) {

        return {
          ...chat,
          pinned: !chat.pinned
        };

      }

      return chat;

    });

    const {
      saveChats
    } = require(
      "../services/chatService"
    );

    saveChats(updated);

    res.json({
      success: true
    });

  }
);

router.post(
  "/favorite/:contactId",
  (req, res) => {

    const chats = getChats();

    const updated = chats.map(chat => {

      if (
        chat.contactId ===
        req.params.contactId
      ) {

        return {
          ...chat,
          favorite: !chat.favorite
        };

      }

      return chat;

    });

    saveChats(updated);

    res.json({
      success: true
    });

  }
);

router.delete(
  "/message/:messageId",
  (req, res) => {

    const chats = getChats();

    const updated =
      chats.filter(
        chat =>
          chat.id !==
          req.params.messageId
      );

    saveChats(updated);

    res.json({
      success: true
    });

  }
);

module.exports = router;