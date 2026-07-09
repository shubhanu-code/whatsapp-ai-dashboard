const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const pino   = require("pino");
const { getRules }                               = require("./ruleServiceSql");
const { addMessage, messageExists, getRecentMessages } = require("./chatServiceSql");
const { getSettings }                           = require("./settingsServiceSql");
const { addContact, getContactByPhone }         = require("./contactServiceSql");
const { addUsage }                              = require("./aiUsageServiceSql");

// REMOVED Static top-level destruction to avoid the circular/uninitialized module execution race condition.
// const { updateWhatsappStatus, updateLatestQR } = require("../server.cjs");

const {generateReply,FALLBACK_REPLY,FALLBACK_MODEL} = require("./aiService");
// ── Constants ─────────────────────────────────────────────────────────────────
const AUTH_PATH        = "./auth/baileys";
// ── Message parsing ───────────────────────────────────────────────────────────

function extractMessageText(msg) {
  if (!msg?.message) return "";
  return (
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    ""
  );
}

function parseMessage(msg, fallbackName = "Unknown") {
  const text = extractMessageText(msg);
  if (!text) return null;

  const waJid = msg.key.remoteJidAlt || msg.key.remoteJid || "";

  return {
    id:          msg.key.id,
    phoneNumber: waJid.replace("@s.whatsapp.net", ""),
    waJid,
    waLid:       msg.key.remoteJid || null,
    // FALLBACK CHAIN: Immediate pushName -> Existing DB Name -> "Unknown"
    contactName: msg.pushName || fallbackName, 
    message:     text,
    direction:   msg.key.fromMe ? "outgoing" : "incoming",
    timestamp:   new Date(msg.messageTimestamp * 1000).toISOString(),
  };
}

// ── DB helpers ────────────────────────────────────────────────────────────────

function saveIncomingMessage(parsed) {
  if (messageExists(parsed.id)) return;
  addMessage({
    id:          parsed.id,
    phoneNumber: parsed.phoneNumber,
    waJid:       parsed.waJid,
    waLid:       parsed.waLid,
    contactName: parsed.contactName,
    message:     parsed.message,
    direction:   "incoming",
    timestamp:   parsed.timestamp,
    read:        true,
  });
}

function saveManualOutgoingMessage(parsed) {
  if (messageExists(parsed.id)) return;
  addMessage({
    id:          parsed.id,
    phoneNumber: parsed.phoneNumber,
    waJid:       parsed.waJid,
    waLid:       parsed.waLid,
    contactName: parsed.contactName,
    message:     parsed.message,
    direction:   "outgoing",
    timestamp:   parsed.timestamp,
    read:        true,
  });
}

function upsertContact(parsed, existing) {
  if (parsed.phoneNumber.endsWith("@g.us")) return;
  addContact({
    phoneNumber:  parsed.phoneNumber,
    waJid:        parsed.waJid,
    waLid:        parsed.waLid,
    name:         existing?.name         || parsed.contactName,
    relationship: existing?.relationship || "Unknown",
    aiContext:    existing?.aiContext    || "",
    botEnabled:   existing?.botEnabled  ?? false,
    createdAt:    existing?.createdAt   || new Date().toISOString(),
  });
}

function saveOutgoingMessage(parsed, replyText, metadata = {}) {
  const uniqueId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  addMessage({
    id:          uniqueId,
    phoneNumber: parsed.phoneNumber,
    waJid:       parsed.waJid,
    waLid:       parsed.waLid,
    contactName: parsed.contactName,
    message:     replyText,
    direction:   "outgoing",
    timestamp:   new Date().toISOString(),
    read:        true,
    replySource: metadata.replySource || null,
    aiProvider:  metadata.aiProvider  || null,
    aiModel:     metadata.aiModel     || null,
    latencyMs:   metadata.latencyMs   || null,
    ruleId:      metadata.ruleId      || null,
  });
}

function recordAIUsage(parsed, usage, model, provider, latencyMs) {
  addUsage({
    phoneNumber:      parsed.phoneNumber,
    model,
    provider,
    promptTokens:     usage?.prompt_tokens     || 0,
    completionTokens: usage?.completion_tokens || 0,
    totalTokens:      usage?.total_tokens      || 0,
    latencyMs,
    timestamp:        new Date().toISOString(),
  });
}

// ── Core AI reply flow (shared by "ai" and "smart" modes) ────────────────────

async function handleAIReply(sock, parsed, contact, modeName, settings) {
  try {
    console.log(`ENTERED ${modeName.toUpperCase()} BLOCK`);    
    const history =
        settings.memory_enabled === "true"
            ? getRecentMessages(
                parsed.phoneNumber,
                Number(settings.memory_limit || 10)
              )
            : [];

    const startedAt = Date.now();
    const {
        reply: aiReply,
        usage
    } = await generateReply(
        parsed.message,
        history,
        contact,
        settings
  );
    const latencyMs = Date.now() - startedAt;
    const model = settings.ai_model || FALLBACK_MODEL;
    const provider = settings.ai_provider || "groq";

    recordAIUsage(parsed, usage, model, provider, latencyMs);

    if (!aiReply?.trim()) {
      console.log("EMPTY AI REPLY — skipped");
      return;
    }

    await sock.sendMessage(parsed.waJid, { text: aiReply });
    saveOutgoingMessage(parsed, aiReply, {
      replySource: "ai",
      aiProvider: provider,
      aiModel: model,
      latencyMs
    });
    console.log(`🤖 ${modeName.toUpperCase()} REPLY SENT`);
  } catch (err) {
    console.error(`${modeName.toUpperCase()} MODE ERROR:`, err);
    await sock.sendMessage(parsed.waJid, { text: FALLBACK_REPLY });
  }
}

// ── History sync helper (used by messaging-history.set) ─────────────────────
function persistHistoryMessages(messages) {
  if (!Array.isArray(messages)) return;

  const contactCache = new Map();

  for (const msg of messages) {
    try {
      if (msg.key?.remoteJid?.endsWith("@g.us")) continue;

      const waJid = msg.key.remoteJidAlt || msg.key.remoteJid || "";
      const phoneNumber = waJid.replace("@s.whatsapp.net", "");
      
      let cachedContact = contactCache.get(phoneNumber);
      if (!cachedContact) {
        cachedContact = getContactByPhone(phoneNumber);
      }

      const bestFallbackName = cachedContact?.name || "Unknown";
      const parsed = parseMessage(msg, bestFallbackName);
      if (!parsed) continue;
      if (messageExists(parsed.id)) continue;

      addMessage({
        id:          parsed.id,
        phoneNumber: parsed.phoneNumber,
        waJid:       parsed.waJid,
        waLid:       parsed.waLid,
        contactName: parsed.contactName,
        message:     parsed.message,
        direction:   parsed.direction,
        timestamp:   parsed.timestamp,
        read:        true,
      });

      if (parsed.direction === "incoming") {
        let finalizedName = "Unknown";
        if (cachedContact?.name && cachedContact.name !== "Unknown") {
          finalizedName = cachedContact.name;
        } else if (msg.pushName && msg.pushName !== "Unknown") {
          finalizedName = msg.pushName;
        }

        const updatedContactPayload = {
          ...cachedContact,
          phoneNumber: parsed.phoneNumber,
          waJid:       parsed.waJid,
          waLid:       parsed.waLid,
          name:        finalizedName,
        };

        upsertContact(parsed, updatedContactPayload);
        contactCache.set(parsed.phoneNumber, updatedContactPayload);
      }
    } catch (err) {
      console.error("HISTORY SYNC — failed to save message:", err);
    }
  }
}

// ── Baileys bootstrap ─────────────────────────────────────────────────────────

async function startBaileys() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);

  const logger = pino({
    level: "silent"
  });

  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log("BAILEYS WA VERSION:", version, "| isLatest:", isLatest);

  const sock = makeWASocket({
    auth: state,
    logger,
    version,
    syncFullHistory: false,
    markOnlineOnConnect: false
  });

  global.baileysSock = sock;

  sock.ev.on("creds.update", saveCreds);

  // ── Event: connection state ─────────────────────────────────────────────
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    // RESOLUTION: Resolve imports dynamically inside the execution loop to avoid uninitialized circular references.
    const serverModule = require("../server.cjs");
    const updateLatestQR = serverModule.updateLatestQR;
    const updateWhatsappStatus = serverModule.updateWhatsappStatus;

    // 1. Handle QR Generation safely inside the callback
    if (qr && typeof updateLatestQR === "function") {
        updateLatestQR(qr);
        if (typeof updateWhatsappStatus === "function") updateWhatsappStatus("qr_ready");
    }

    // 2. Handle connection states
    if (connection === 'open') {
        if (typeof updateLatestQR === "function") updateLatestQR(null);
        if (typeof updateWhatsappStatus === "function") updateWhatsappStatus("connected");
        console.log("===== READY EVENT FIRED =====");
    } else if (connection === 'close') {
        if (typeof updateLatestQR === "function") updateLatestQR(null);
        if (typeof updateWhatsappStatus === "function") updateWhatsappStatus("disconnected");
        
        const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== 401);
        if (shouldReconnect) {
            startBaileys();
        }
    }
  });

  sock.ev.on("messages.update", () => {});

  sock.ev.on("messaging-history.set", ({ chats, contacts, messages, syncType }) => {
    console.log("========== HISTORY SYNC ==========");
    console.log("Sync Type:", syncType);
    console.log("Chats:", chats?.length || 0);
    console.log("Contacts:", contacts?.length || 0);
    console.log("Messages:", messages?.length || 0);
    console.log("===================================");

    persistHistoryMessages(messages);
  });

  sock.ev.on("presence.update", () => {});
  sock.ev.on("chats.upsert", (data) => {
    console.log("CHATS.UPSERT count:", data?.length || 0);
  });

  function handleContactsUpdate(contacts) {
    if (!Array.isArray(contacts)) return;
    for (const c of contacts) {
      try {
        const realName = c.name || c.verifiedName || c.notify;
        if (!realName) continue; 

        const waJid = c.id || "";
        if (waJid.endsWith("@g.us")) continue; 
        const phoneNumber = waJid.replace("@s.whatsapp.net", "");
        if (!phoneNumber) continue;

        const existing = getContactByPhone(phoneNumber);
        addContact({
          phoneNumber,
          waJid,
          waLid:        existing?.waLid || null,
          name:         realName,
          relationship: existing?.relationship || "Unknown",
          aiContext:    existing?.aiContext    || "",
          botEnabled:   existing?.botEnabled  ?? false,
          createdAt:    existing?.createdAt   || new Date().toISOString(),
        });
      } catch (err) {
        console.error("CONTACTS SYNC — failed to save contact:", err);
      }
    }
  }

  sock.ev.on("contacts.upsert", handleContactsUpdate);
  sock.ev.on("contacts.update", handleContactsUpdate);

  // ── Event: incoming / outgoing messages ─────────────────────────────────
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    const msg = messages?.[0];
    if (!msg)                                     return;
    if (msg.key.remoteJid?.endsWith("@g.us"))     return;

    const waJid = msg.key.remoteJidAlt || msg.key.remoteJid || "";
    const phoneNumber = waJid.replace("@s.whatsapp.net", "");

    const existingContact = getContactByPhone(phoneNumber);
    
    let bestFallbackName = "Unknown";
    if (existingContact?.name && existingContact.name !== "Unknown") {
      bestFallbackName = existingContact.name;
    } else if (msg.pushName && msg.pushName !== "Unknown") {
      bestFallbackName = msg.pushName;
    }

    const parsed = parseMessage(msg, bestFallbackName);
    if (!parsed) {
      console.log("EMPTY TEXT — skipped");
      return;
    }

    if (msg.key.fromMe) {
      console.log("OUTGOING (manual) MESSAGE:", parsed.phoneNumber);
      saveManualOutgoingMessage(parsed);
      return;
    }

    console.log("PHONE:", parsed.phoneNumber);

    saveIncomingMessage(parsed);
    
    const sanitizedContactInfo = {
      ...existingContact,
      name: bestFallbackName !== "Unknown" ? bestFallbackName : (parsed.contactName || "Unknown")
    };
    upsertContact(parsed, sanitizedContactInfo);
    
    const contact   = getContactByPhone(parsed.phoneNumber);
    const isAllowed = Boolean(contact?.botEnabled);
    const settings = getSettings();
    console.log("CURRENT MODE:", settings.replyMode);

    if (!isAllowed) {
      console.log("CONTACT NOT ALLOWED:", parsed.phoneNumber);
      return;
    }

    console.log("BOT ENABLED:", contact?.botEnabled);

    const rules       = getRules();
    const msgText     = parsed.message.toLowerCase().trim();
    const matchedRule = rules.find((r) => {
      if (!r.isActive) return false;
      const keyword = (r.keyword || "").toLowerCase().trim();
      return r.matchType === "exact" ? msgText === keyword : msgText.includes(keyword);
    });

    if (matchedRule) {
      console.log("🔥 RULE TRIGGERED:", matchedRule.keyword);
      await sock.sendMessage(parsed.waJid, { text: matchedRule.reply });
      saveOutgoingMessage(parsed, matchedRule.reply, {
        replySource: "rule",
        ruleId: matchedRule.id
      });
      return;
    }

    const { replyMode } = settings;

    if (replyMode === "smart" || replyMode === "ai") {
      await handleAIReply(sock, parsed, contact, replyMode, settings);
    }
  });

  return sock;
}

module.exports = { startBaileys };