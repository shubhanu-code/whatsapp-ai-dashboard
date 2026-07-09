const express = require("express");
const router = express.Router();

const {
  getChats,
  deleteMessage,
  addMessage,
  deleteChat,
  markChatRead,
  markChatUnread
} = require("../services/chatServiceSql");

const {
  togglePin,
  toggleFavorite,
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

    const contactKey =
      chat.phoneNumber ||
      chat.waLid ||
      chat.waJid;
    

    if (!conversations[contactKey]) {
      conversations[contactKey] = {
        phoneNumber: contactKey,
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
            contactKey
          ]?.pinned || false,
        favorite:
          conversationMeta[
            contactKey
          ]?.favorite || false,
      };

    } else {

      conversations[contactKey].lastMessage =
        chat.message;

      conversations[contactKey].timestamp =
        chat.timestamp;

      conversations[contactKey].messageCount += 1;

      if (
        chat.direction === "incoming" &&
        !chat.read
      ) {
        conversations[
          contactKey
        ].unreadCount += 1;
      }

    }

  });

  res.json(
    Object.values(conversations)
  );

});
router.get("/:phoneNumber", (req, res) => {

  const chats = getChats();

  const messages = chats.filter(chat => {

    const contactKey =
      chat.phoneNumber ||
      chat.waLid ||
      chat.waJid;

    return contactKey === req.params.phoneNumber;

  });
    res.json(messages);

});

router.post("/send", async (req, res) => {

  try {

    const { phoneNumber, message } =
      req.body;

    if (!phoneNumber || !message) {

      return res.status(400).json({
        error: "Missing fields"
      });

    }
    let jid = phoneNumber;

    if (!jid.includes("@")) {
      jid = `${jid}@s.whatsapp.net`;
    }

    console.log("SENDING TO JID:", jid);

    await global.baileysSock.sendMessage(
      jid,
      {
        text: message
      }
    );
    addMessage({
      id: Date.now().toString(),

      phoneNumber,

      waJid: jid,

      waLid: null,

      contactName: "",

      message,

      direction: "outgoing",

      timestamp: new Date().toISOString(),

      read: true,

      replySource: "manual"
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
  "/pin/:phoneNumber",
  (req, res) => {

    togglePin(
      req.params.phoneNumber
    );

    res.json({
      success: true
    });

  }
);

router.post(
  "/favorite/:phoneNumber",
  (req, res) => {

    toggleFavorite(
      req.params.phoneNumber
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
router.delete("/:phoneNumber", (req, res) => {

  deleteChat(req.params.phoneNumber);

  res.json({
    success: true
  });

});

router.post("/read/:phoneNumber", (req, res) => {

  markChatRead(req.params.phoneNumber);

  res.json({
    success: true
  });

});

router.post("/unread/:phoneNumber", (req, res) => {

  markChatUnread(req.params.phoneNumber);

  res.json({
    success: true
  });

});

module.exports = router;
