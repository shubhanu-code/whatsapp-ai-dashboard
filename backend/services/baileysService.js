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


async function generateGroqReply(message,history = [],contact) {

  const settings =
    getSettings();
  const model =
    settings.ai_model ||
    "llama-3.1-8b-instant";

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
  const memoryLimit =
    Number(
      settings.memory_limit || 10
    );

  const memoryText =
    history
      .slice(-memoryLimit)
      .map(msg =>
        `${msg.direction}: ${msg.message}`
      )
      .join("\n");
  console.log(
    "MODEL:",
    model
  );

  console.log(
    "PERSONALITY:",
    settings.ai_personality
  );
  const systemPrompt = `
  OWNER:
  Shubhanu Chatterjee

  OWNER INFO:
  Studies DSAI at IIIT Dharwad.
  AI PERSONALITY:
  ${settings.ai_personality || "friendly"}

  CONTACT:
  Name: ${contact.name || "Unknown"}

  Relationship:
  ${contact.relationship || "Unknown"}

  CONTACT PROFILE INSTRUCTIONS:
  ${contact.aiContext || "No special instructions"}

  RECENT CONVERSATION MEMORY:
  ${memoryText || "No memory available"}

  RULES:
  - You are Shubhanu's AI assistant.
  - The CONTACT above is the person currently chatting.
  - If the contact asks "Who am I?", answer using the CONTACT information.
  - If the contact asks about Shubhanu, answer using OWNER information.
  - Follow the contact profile instructions.
  - CONTACT PROFILE instructions override GLOBAL CONTEXT when there is a conflict.
  - Keep replies concise.

  PERSONALITY RULES:

    - friendly: warm and approachable.
    - professional: concise and business-like.
    - casual: relaxed and conversational.
    - formal: respectful and structured.
    - humorous: light humor when appropriate.

  GLOBAL CONTEXT:
  ${aiContext}
  `;

  
  const messages = [
    {
      role: "system",
      content: systemPrompt
    },
    ...conversationHistory
  ];
  try {

    const completion =
      await groq.chat.completions.create({
        model,
        messages
      });

    return completion
      .choices[0]
      .message.content;

  } catch (err) {

    console.error(
      "MODEL FAILED:",
      model
    );

    const fallback =
      await groq.chat.completions.create({

        model:
          "llama-3.1-8b-instant",

        messages

      });

    return fallback
      .choices[0]
      .message.content;

  }

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
              message: matchedRule.reply,
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
                history,
                contact
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
                history,
                contact
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