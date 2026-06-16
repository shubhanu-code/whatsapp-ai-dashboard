const express = require("express");
const router = express.Router();

const {
  getChats,
  addMessage,
  deleteMessage
} = require("../services/chatServiceSql");

const {
  togglePin,
  toggleFavorite,
  getConversation,
  getAllConversations
} = require(
  "../services/conversationServiceSql"
);


router.get("/", (req, res) => {
  res.json(getChats());
});
router.get("/conversations", (req, res) => {

  const chats = getChats();
  const conversationMeta =
    getAllConversations();
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
        pinned:
          conversationMeta[
            chat.contactId
          ]?.pinned || false,
        favorite:
          conversationMeta[
            chat.contactId
          ]?.favorite || false,
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

    togglePin(
      req.params.contactId
    );

    res.json({
      success: true
    });

  }
);

router.post(
  "/favorite/:contactId",
  (req, res) => {

    toggleFavorite(
      req.params.contactId
    );

    res.json({
      success: true
    });

  }
);

router.delete(
  "/message/:messageId",
  (req, res) => {

    deleteMessage(
      req.params.messageId
    );

    res.json({
      success: true
    });

  }
);

module.exports = router;