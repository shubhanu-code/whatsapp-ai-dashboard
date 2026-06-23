const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const {getAllowedContacts} = require("./allowedContactsServiceSql");
const { getRules } = require("./ruleServiceSql");
const {addMessage,messageExists,getRecentMessages} = require("./chatServiceSql");
const {getSettings} = require("./settingsServiceSql");
const {addContact,getContactByPhone} = require("./contactServiceSql");
const Groq = require('groq-sdk');
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


async function generateGroqReply(message,history = []) {

  const settings =
    getSettings();

  const aiContext =
    settings.ai_context || "";
  const conversationHistory =
    history.map(msg => ({
      role:
        msg.direction === "incoming"
          ? "user"
          : "assistant",

      content:
        msg.message
    }));

  const systemPrompt = `
${aiContext}

You are a helpful WhatsApp assistant.
Keep replies short and friendly.
`;

  const completion =
    await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",

      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...conversationHistory,
        {
          role: "user",
          content: message
        }
      ]
    });

  return completion
    .choices[0]
    .message.content;
}

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

  const P = require("pino");

  const sock = makeWASocket({
    auth: state,
    syncFullHistory: false,
    markOnlineOnConnect: false,

    logger: P({
      level: "error"
    })
  });
  global.baileysSock = sock;
  sock.ev.on(
    "messages.update",
    () => {}
  );

    sock.ev.on("messaging-history.set", data => {
    console.log(
        "HISTORY.SET:",
        data.messages?.length,
        data.contacts?.length,
        data.chats?.length
    );
    });

    sock.ev.on("presence.update", data => {
    console.log(
        "PRESENCE:",
        JSON.stringify(data, null, 2)
    );
    });

    sock.ev.on("chats.upsert", data => {
    console.log(
        "CHATS.UPSERT:",
        JSON.stringify(data, null, 2)
    );
    });

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
          "=====READY EVENT FIRED======"
        );
      }
    }
  );

  sock.ev.on(
    "messages.upsert",
    async ({ messages, type }) => {

        const msg = messages?.[0];

        if (!msg) return;
        if (msg.key.fromMe) return;
        if (msg.key.remoteJid?.endsWith("@g.us"))return;

        const text = extractMessageText(msg);

        if (!text) {
            console.log("EMPTY TEXT");
            return;
        }
      

      const parsed = {
        id: msg.key.id,

        phoneNumber:
            (msg.key.remoteJidAlt || "")
            .replace("@s.whatsapp.net", ""),

        waJid:
            msg.key.remoteJidAlt || null,

        waLid:
            msg.key.remoteJid || null,

        contactName:
            msg.pushName || "Unknown",

        message: text,

        direction:
            "incoming",

        timestamp:
            new Date(
            msg.messageTimestamp * 1000
            ).toISOString()
        };
        
      const existingContact =
        getContactByPhone(
          parsed.phoneNumber
        );
      if (!messageExists(parsed.id)) {

        addMessage({
          id: parsed.id,
          phoneNumber: parsed.phoneNumber,
          waJid: parsed.waJid,
          waLid: parsed.waLid,
          contactName: parsed.contactName,
          message: parsed.message,
          direction: "incoming",
          timestamp: parsed.timestamp,
          read: true
        });

      }
      if (
        !parsed.phoneNumber.endsWith("@g.us")
      ) {

        addContact({
          phoneNumber:
            parsed.phoneNumber,

          waJid:
            parsed.waJid,

          waLid:
            parsed.waLid,

          name:
            existingContact?.name ||
            parsed.contactName,

          relationship:
            existingContact?.relationship ||
            "Unknown",

          botEnabled:
            existingContact?.botEnabled ||
            false,

          createdAt:
            existingContact?.createdAt ||
            new Date().toISOString()
        });

      }


        console.log(
            "PHONE:",
            parsed.phoneNumber
            );

        const contact =
          getContactByPhone(
            parsed.phoneNumber
          );

        const isAllowed =
          Boolean(contact?.botEnabled);
        console.log(
            "CURRENT MODE:",
            getSettings().replyMode
            );

        if (!isAllowed) {
        console.log(
            "CONTACT NOT ALLOWED:",
            parsed.phoneNumber
        );
        return;
        }
        console.log(
          "BOT ENABLED:",
          contact?.botEnabled
        );
        const rules = getRules();

        const matchedRule = rules.find(r => {
        if (!r.isActive) return false;

        const msgText =
            parsed.message.toLowerCase().trim();

        const keyword =
            (r.keyword || "")
            .toLowerCase()
            .trim();

        if (r.matchType === "exact") {
            return msgText === keyword;
        }

        return msgText.includes(keyword);
        });
        if (matchedRule) {
            console.log("🔥 BAILEYS REPLY");
            await sock.sendMessage(
                parsed.waJid,
                {
                text: matchedRule.reply
                }
            );
            addMessage({
              id: `ai-${Date.now()}`,
              phoneNumber: parsed.phoneNumber,
              waJid: parsed.waJid,
              waLid: parsed.waLid,
              contactName: parsed.contactName,
              message: aiReply,
              direction: "outgoing",
              timestamp: new Date().toISOString(),
              read: true
            });

            console.log(
                "RULE TRIGGERED:",
                matchedRule.keyword
            );

            return;
            }
        const currentSettings =
          getSettings();

        if (
          currentSettings.replyMode === "smart"
        ) {

          try {

            console.log(
              "ENTERED SMART AI BLOCK"
            );

            const settings =
              getSettings();

            const history =
              settings.memory_enabled ===
              "true"
                ? getRecentMessages(
                    parsed.phoneNumber,
                    Number(
                      settings.memory_limit || 10
                    )
                  )
                : [];

            console.log(
              "MEMORY LOADED:",
              history.length
            );

            const aiReply =
              await generateGroqReply(
                parsed.message,
                history
              );

            await sock.sendMessage(
              parsed.waJid,
              {
                text: aiReply
              }
            );
            addMessage({
              id: `ai-${Date.now()}`,
              phoneNumber: parsed.phoneNumber,
              waJid: parsed.waJid,
              waLid: parsed.waLid,
              contactName: parsed.contactName,
              message: aiReply,
              direction: "outgoing",
              timestamp: new Date().toISOString(),
              read: true
            });

            console.log(
              "🤖 SMART MODE AI REPLY"
            );

          } catch (err) {

            console.error(
              "SMART MODE ERROR:",
              err
            );

            await sock.sendMessage(
              parsed.waJid,
              {
                text:
                  "Sorry, I'm temporarily unavailable."
              }
            );

          }

          return;
        }

        if (
          currentSettings.replyMode === "ai"
        ) {

          try {

            console.log(
              "ENTERED AI BLOCK"
            );

            const settings =
              getSettings();

            const history =
              settings.memory_enabled ===
              "true"
                ? getRecentMessages(
                    parsed.phoneNumber,
                    Number(
                      settings.memory_limit || 10
                    )
                  )
                : [];

            console.log(
              "MEMORY:",
              history
            );

            const aiReply =
              await generateGroqReply(
                parsed.message,
                history
              );

            await sock.sendMessage(
              parsed.waJid,
              {
                text: aiReply
              }
            );
            addMessage({
              id: `ai-${Date.now()}`,
              phoneNumber: parsed.phoneNumber,
              waJid: parsed.waJid,
              waLid: parsed.waLid,
              contactName: parsed.contactName,
              message: aiReply,
              direction: "outgoing",
              timestamp: new Date().toISOString(),
              read: true
            });

            console.log(
              "🤖 AI REPLY"
            );

          } catch (err) {

            console.error(
              "AI MODE ERROR:",
              err
            );

            await sock.sendMessage(
              parsed.waJid,
              {
                text:
                  "Sorry, I'm temporarily unavailable."
              }
            );

          }

          return;
}
        
      console.log(
        "\n=== PARSED MESSAGE ==="
      );


        if (!messageExists(parsed.id)) {

        addMessage({
            id: parsed.id,
            phoneNumber: parsed.phoneNumber,
            waJid: parsed.waJid,
            waLid: parsed.waLid,
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
                phoneNumber:
                    parsed.phoneNumber
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