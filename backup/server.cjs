require('dotenv').config();
require("./db/database");
const {
  getAnalytics,
  getTopContacts,
  getMessageBreakdown,
  getPeakHours,
  getDailyActivity
} = require("./services/analyticsService");
const startTime = Date.now();

const { getRules, saveRules } = require("./services/ruleServiceSql");
const { getSettings, saveSettings } = require("./services/settingsServiceSql");
const { getAllowedContacts, saveAllowedContacts } = require("./services/allowedContactsServiceSql");

// FIX #1: Removed togglePin/toggleFavorite — they were imported here but
// never used in index.js. They are only used in chatRoutes.js which already
// imports them directly from conversationServiceSql.
const db = require("./db/database");
const { startBaileys } =require("./services/baileysService");

// Suppress the benign detached-frame race that fires on LOGOUT teardown.
process.on('unhandledRejection', err => {
  if (err && /detached Frame/i.test(err.message || '')) {
    console.warn('IGNORED (benign detached-frame race during teardown):', err.message);
    return;
  }
  console.error('UNHANDLED REJECTION:', err);
});

process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

const {
  addMessage,
  deleteChat,
  // FIX #2: Removed getChats — it was imported but never called in index.js.
  // It is used only inside chatRoutes.js which imports it directly.
  markChatRead,
  markChatUnread,
  messageExists,
} = require("./services/chatServiceSql");

const {
  getContacts,
  saveContacts,
  addContact,
  getContactByPhone
} = require("./services/contactServiceSql");

const chatRoutes = require("./routes/chatRoutes");

let isReinitializing = false;
let readyFired = false;
let authProcessed = false;
let whatsappStatus = 'starting';
let latestQR = null;
let startupWatchdog;

// NOTE: saveOutgoingReply was removed. All outgoing bot replies are now
// saved exclusively by the message_create handler, which fires automatically
// whenever msg.reply() is called. This eliminates the duplicate DB writes
// that caused two bot messages to appear in the inbox.

function startStartupWatchdog() {
  clearTimeout(startupWatchdog);
  startupWatchdog = setTimeout(async () => {
    if (whatsappStatus !== 'ready') {
      console.log('WARNING: Startup stalled, forcing restart');
      try { await client.destroy(); } catch (e) { console.error('WATCHDOG DESTROY ERROR:', e); }
      readyFired = false;
      authProcessed = false;
      isReinitializing = false;
      whatsappStatus = 'restarting';
      client.initialize().catch(err => { console.error('WATCHDOG REINIT FAILED:', err); });
    }
  }, 20000);
}

const AUTH_DIR = process.env.AUTH_DIR || './wa-auth';
const BROWSER_PATH = process.env.BROWSER_PATH;
const HEADLESS = process.env.WA_HEADLESS === 'true' ? 'new' : false;

const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
console.log("GROQ KEY:", process.env.GROQ_API_KEY ? "FOUND" : "MISSING");

const chatMemory = new Map();

// DOUBLE-REPLY FIX: tracks message IDs currently being processed so that
// the echo of our own msg.reply() — which whatsapp-web.js fires back as a
// 'message' or 'message_create' event in some versions — cannot re-enter
// the handler and trigger a second reply before messageExists() catches it.
const processingIds = new Set();
const fs = require('fs');
const path = require("path");
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

async function generateAIReplyWithMemory(history, contactInfo) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `
        You are Shubhanu replying on WhatsApp.

        About Shubhanu:
        - Studies at IIIT Dharwad
        - Uses WhatsApp casually
        - Replies naturally
        - Keeps messages concise
        - Never says he is an AI

        Current contact:
        Name: ${contactInfo.name}
        Relationship: ${contactInfo.relationship}
        Number: ${contactInfo.number}
        Relationship guidance:

        - Mother/Father/Parent: Be warm, respectful and caring.
        - Brother/Sister/Cousin: Be casual and friendly.
        - College Friend: Be relaxed, informal and natural.
        - Classmate: Be helpful and collaborative.
        - Recruiter: Be professional and polite.
        - Faculty: Be respectful and concise.
        - Unknown: Be friendly and neutral.

        Reply as Shubhanu would.
        `
      },
      ...history.slice(-12)
    ]
  });
  return completion.choices[0].message.content;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

global.io = io;

io.on("connection", socket => {
  console.log("Socket connected:", socket.id);
});

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use("/chats", chatRoutes);

console.log('SETTINGS LOADED:', getSettings());
console.log('RULES LOADED:', getRules().length);
console.log('ALLOWED CONTACTS LOADED:', getAllowedContacts().length);
console.log('CONTACTS LOADED:', getContacts().length);

// ── Routes ──────────────────────────────────────────────────────────────────

app.delete("/messages/:contactId", (req, res) => {
  deleteChat(req.params.contactId);
  res.json({ success: true });
});

app.get('/allowed-contacts', (req, res) => {
  try {
    res.json(getAllowedContacts());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load allowed contacts" });
  }
});

app.post('/allowed-contacts', (req, res) => {
  try {
    saveAllowedContacts(req.body);
    console.log("Allowed Contacts Saved:", req.body.length);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save allowed contacts" });
  }
});

async function generateGroqReply(message) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are a helpful WhatsApp assistant. Keep replies short and friendly." },
      { role: "user", content: message }
    ]
  });
  return completion.choices[0].message.content;
}

app.post('/ai-reply', async (req, res) => {
  const { message } = req.body;
  try {
    const reply = await generateGroqReply(message);
    res.json({ reply });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ reply: "Sorry, AI is unavailable." });
  }
});

app.get('/contacts', (req, res) => {
  try {
    res.json(getContacts());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load contacts" });
  }
});

app.post('/contacts', (req, res) => {
  try {
    saveContacts(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save contacts" });
  }
});

app.get('/settings', (req, res) => {
  try {
    res.json(getSettings());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

app.get('/rules', (req, res) => {
  try {
    res.json(getRules());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load rules" });
  }
});

app.post('/settings', (req, res) => {
  try {
    console.log("SETTINGS RECEIVED:", req.body);
    saveSettings(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

app.post('/rules', (req, res) => {
  try {
    saveRules(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save rules" });
  }
});

app.get('/status', (req, res) => {
  res.json({ whatsappStatus, hasQR: !!latestQR });
});

app.post("/messages/read/:contactId", (req, res) => {
  markChatRead(req.params.contactId);
  res.json({ success: true });
});

app.post("/messages/unread/:contactId", (req, res) => {
  markChatUnread(req.params.contactId);
  res.json({ success: true });
});

app.get("/analytics", (req, res) => {
  try {
    res.json(getAnalytics());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

app.get("/analytics/top-contacts", (req, res) => {
  try {
    res.json(getTopContacts());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load contacts" });
  }
});

app.get("/analytics/breakdown", (req, res) => {
  try {
    res.json(getMessageBreakdown());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load breakdown" });
  }
});

app.get("/analytics/peak-hours", (req, res) => {
  try {
    res.json(getPeakHours());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load peak hours" });
  }
});

app.get("/analytics/daily-activity", (req, res) => {
  try {
    res.json(getDailyActivity());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load activity" });
  }
});

// ── WhatsApp Client ──────────────────────────────────────────────────────────

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'main', dataPath: AUTH_DIR }),
  puppeteer: {
    executablePath: BROWSER_PATH,
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-extensions',
      '--disable-gpu'
    ]
  }
});
global.waClient = client;

client.on('qr', qr => {
  whatsappStatus = 'qr';
  latestQR = qr;
  isReinitializing = false;
  console.log('QR GENERATED');
  qrcode.generate(qr, { small: true });
});

client.on('loading_screen', (percent, message) => {
  console.log('LOADING:', percent, message);
  startStartupWatchdog();
});

client.on('authenticated', () => {
  if (authProcessed) return;
  authProcessed = true;
  console.log('AUTHENTICATED');
});

client.on('auth_failure', async msg => {
  console.log('AUTH FAILURE:', msg);
  whatsappStatus = 'auth_failure';
});

client.on('disconnected', async reason => {
  whatsappStatus = 'disconnected';
  readyFired = false;
  authProcessed = false;
  console.log('DISCONNECTED:', reason);

  if (isReinitializing) return;
  isReinitializing = true;

  try {
    if (client.pupPage && !client.pupPage.isClosed()) {
      client.pupPage.removeAllListeners('framenavigated');
    }
  } catch (err) {
    console.error('LISTENER CLEANUP ERROR:', err);
  }

  try {
    await client.destroy();
  } catch (err) {
    console.error('DESTROY ERROR:', err);
  }

  if (reason === 'LOGOUT') {
    const sessionPath = path.join(AUTH_DIR, 'session-main');
    try {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log('Cleared stale session after LOGOUT');
    } catch (err) {
      console.error('SESSION CLEANUP ERROR:', err);
    }
  }

  setTimeout(() => {
    console.log('REINITIALIZING...');
    startStartupWatchdog();
    client.initialize().catch(err => {
      isReinitializing = false;
      whatsappStatus = 'init_failed';
      console.error('REINIT FAILED:', err);
    });
  }, 5000);
});

client.on('change_state', state => { console.log('STATE:', state); });

client.on('ready', async () => {
  if (readyFired) return;
  readyFired = true;
  isReinitializing = false;
  clearTimeout(startupWatchdog);
  whatsappStatus = 'ready';

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('=== READY EVENT FIRED ===');
  console.log(`READY after ${seconds}s`);

  try {
    const chats = await client.getChats();
    const recentChats = chats
      .filter(chat => !chat.isGroup && chat.lastMessage)
      .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp)
      .slice(0, 30);

    console.log("TOTAL CHATS:", chats.length);
    console.log("RECENT CHATS:", recentChats.length);

    let imported = 0;
    for (const chat of recentChats) {
      if (chat.isGroup || !chat.lastMessage) continue;
      try {
        const messages = await chat.fetchMessages({ limit: 20 });
        for (const msg of messages) {
          if (!msg.id?._serialized) continue;
          if (messageExists(msg.id._serialized)) continue;

          addMessage({
            id: msg.id._serialized,
            contactId: chat.id._serialized,
            contactName: chat.name || "Unknown",
            message: msg.body || "",
            direction: msg.fromMe ? "outgoing" : "incoming",
            timestamp: new Date(msg.timestamp * 1000).toISOString(),
            read: true
          });
          imported++;
        }
      } catch (err) {
        console.log("SYNC SKIPPED:", chat.name);
      }
    }
    console.log("MESSAGES IMPORTED:", imported);
  } catch (err) {
    console.error("SYNC TEST ERROR:", err);
  }
});

// FIX #4: Removed the duplicate no-op client.on('message') logger that was
// registered before the real handler. Having two 'message' listeners meant
// every incoming message fired both — the no-op AND the real one.
// The real handler below is the single source of truth for incoming messages.

client.on('message_create', async msg => {
    if (!msg.fromMe) return;

  const chat = await msg.getChat();
  const contactName = chat.name || msg.to;

  // FIX #5: Deduplicated the contact-upsert logic. In the original code,
  // message_create AND the incoming message handler both had identical
  // "if (!exists) addContact(...)" blocks. Extracted into ensureContact().
  ensureContact(msg.to, contactName);

  if (messageExists(msg.id._serialized)) return;

  addMessage({
    id: msg.id._serialized,
    phoneNumber: msg.to,
    waJid: null,
    waLid: null,
    contactName,
    message: msg.body,
    direction: "outgoing",
    timestamp: new Date(msg.timestamp * 1000).toISOString(),
    read: true
  });

  global.io.emit("new_message", { contactId: msg.to });
});

client.on('message_reaction', () => { console.log('REACTION EVENT'); });

client.on('message', async msg => {
  if (msg.fromMe) return;

  const msgId = msg.id._serialized;

  // DOUBLE-REPLY FIX part 1: bail out immediately if this ID is already
  // being handled (catches the whatsapp-web.js echo of our own reply) OR
  // if it was already saved to the DB on a prior event fire.
  if (processingIds.has(msgId) || messageExists(msgId)) return;
  processingIds.add(msgId);

  const sender = msg.from;
  const text = msg.body.toLowerCase();

  const contact = await msg.getContact();
  const savedContact = getContactByPhone(sender);

  const contactInfo = {
    name: savedContact?.name || contact.pushname || contact.name || "Unknown",
    relationship: savedContact?.relationship || "Unknown",
    number: sender
  };

  addMessage({
    id: msgId,
    phoneNumber: sender,
    waJid: null,
    waLid: null,
    contactName: contactInfo.name,
    message: msg.body,
    direction: "incoming",
    timestamp: new Date(msg.timestamp * 1000).toISOString(),
    read: true
  });

  global.io.emit("new_message", { contactId: sender });
  ensureContact(sender, contactInfo.name);

    const currentSettings = getSettings(); 

  const allowedContacts = getAllowedContacts();
  const normalize = id => id.replace(/@(c\.us|lid|s\.whatsapp\.net)$/, '');
  const isAllowed = allowedContacts.some(
    contactId => normalize(contactId) === normalize(sender)
  );

  if (!isAllowed) {
    console.log('CONTACT NOT ALLOWED:', sender);
    processingIds.delete(msgId); // DOUBLE-REPLY FIX: always release the lock
    return;
  }

  const rules = getRules();
  const matchedRule = rules.find(r => {
    if (!r.isActive) return false;
    const contactMatch = r.targetContact === "all" || r.targetContact === savedContact?.id;
    if (!contactMatch) return false;
    const msgText = text.trim();
    const keyword = (r.keyword || "").toLowerCase().trim();
    if (r.matchType === "exact") return msgText === keyword;
    return msgText.includes(keyword);
  });

  // DOUBLE-REPLY FIX part 2: wrap reply logic in try/finally so processingIds
  // is always cleaned up — even if an AI call throws or msg.reply() rejects.
  try {
    if (currentSettings.replyMode === 'rules') {
      if (matchedRule) {
        await msg.reply(matchedRule.reply);
        // message_create fires automatically for msg.reply() and saves
        // the outgoing message + emits new_message — no need to do it here.
      }
      return;
    }

    if (false) {
      if (!chatMemory.has(sender)) chatMemory.set(sender, []);
      const history = chatMemory.get(sender);
      history.push({ role: "user", content: msg.body });
      if (history.length > 20) history.splice(0, history.length - 20);

      try {
        const aiReply = await generateAIReplyWithMemory(history, contactInfo);
        history.push({ role: "assistant", content: aiReply });
        await msg.reply(aiReply);
        // message_create handles saving + emitting for this reply.
      } catch (err) {
        console.error("AI REPLY ERROR:", err);
        await msg.reply("Sorry, I'm having trouble replying right now.");
      }
      return;
    }

    if (currentSettings.replyMode === 'smart') {
      if (matchedRule) {
        await msg.reply(matchedRule.reply);
        // message_create handles saving + emitting.
        return;
      }

      if (!chatMemory.has(sender)) chatMemory.set(sender, []);
      const history = chatMemory.get(sender);
      history.push({ role: "user", content: msg.body });

      try {
        const aiReply = await generateAIReplyWithMemory(history, contactInfo);
        history.push({ role: "assistant", content: aiReply });
        await msg.reply(aiReply);
        // message_create handles saving + emitting.
      } catch (err) {
        console.error("AI REPLY ERROR:", err);
      }
    }
  } finally {
    // DOUBLE-REPLY FIX: release lock after reply is fully sent and saved.
    // Any echo arriving between add and delete is blocked by processingIds.has().
    processingIds.delete(msgId);
  }
});

// FIX #5: Shared helper — replaces duplicate addContact blocks that existed
// in both message_create and the message handler.
function ensureContact(phone, name) {
  const exists = getContactByPhone(phone);

  if (!exists) {
    addContact({
      phoneNumber: phone,
      waJid: null,
      waLid: null,
      name,
      botEnabled: false,
      createdAt: new Date().toISOString()
    });

    console.log("NEW CONTACT SAVED:", name);
  }
}

(async () => {
  try {
    startStartupWatchdog();
    await client.initialize();
    console.log("INITIALIZE CALL COMPLETED");
  } catch (err) {
    console.error("INITIALIZE FAILED:", err);
    whatsappStatus = 'init_failed';
    setTimeout(() => {
      console.log('RETRYING INITIALIZE...');
      client.initialize().catch(e => console.error('RETRY FAILED:', e));
    }, 10000);
  }
})();
(async () => {
  await startBaileys();
})();
server.listen(5000, () => { console.log('Server running on port 5000'); });
