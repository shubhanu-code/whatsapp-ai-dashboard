const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");

const {
  addMessage,
  messageExists
} = require("../backend/services/chatServiceSql");

function extractMessageText(msg) {
  if (!msg?.message) return "";

  if (msg.message.conversation) {
    return msg.message.conversation;
  }

  if (msg.message.extendedTextMessage?.text) {
    return msg.message.extendedTextMessage.text;
  }

  return "";
}

async function startBaileys() {

  const { state, saveCreds } =
    await useMultiFileAuthState(
      "./auth/baileys"
    );

  const sock = makeWASocket({
    auth: state,
    syncFullHistory: false,
    markOnlineOnConnect: false
  });
  global.baileysSock = sock;

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  sock.ev.on(
    "connection.update",
    ({ connection, lastDisconnect, qr }) => {

      if (qr) {
        console.log("QR RECEIVED");

        qrcode.generate(qr, {
          small: true
        });
      }

      console.log(
        "CONNECTION:",
        connection
      );

      if (lastDisconnect) {
        console.log(
          "DISCONNECT:",
          lastDisconnect.error
        );
      }

      if (connection === "open") {
        console.log(
          "WHATSAPP READY"
        );
      }
    }
  );

  sock.ev.on(
    "messages.upsert",
    ({ messages }) => {

      const msg = messages?.[0];

      if (!msg) return;

      const parsed = {
        id: msg.key.id,

        contactId:
          msg.key.remoteJidAlt ||
          msg.key.remoteJid,

        contactName:
          msg.pushName || "Unknown",

        message:
          extractMessageText(msg),

        direction:
          msg.key.fromMe
            ? "outgoing"
            : "incoming",

        timestamp:
          new Date(
            msg.messageTimestamp * 1000
          ).toISOString()
      };

      console.log(
        "\n=== PARSED MESSAGE ==="
      );


        if (!messageExists(parsed.id)) {

        addMessage({
            id: parsed.id,
            contactId: parsed.contactId,
            contactName: parsed.contactName,
            message: parsed.message,
            direction: parsed.direction,
            timestamp: parsed.timestamp,
            read: true
        });

        if (global.io) {
            global.io.emit(
                "new_message",
                {
                contactId:
                    parsed.contactId
                }
            );
            }

        console.log(
            "SAVED TO SQLITE:",
            parsed.message
        );
        }

      console.log(
        "======================\n"
      );
    }
  );

  return sock;
}

module.exports = {
  startBaileys
};