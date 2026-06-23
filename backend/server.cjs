require('dotenv').config();
require("./db/database");
const {
  getAnalytics,
  getTopContacts,
  getMessageBreakdown,
  getPeakHours,
  getDailyActivity
} = require("./services/analyticsService");
const {
  deleteChat,
  markChatRead,
  markChatUnread,
  updateContactName
} = require("./services/chatServiceSql");
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
  getContacts,
  saveContacts,
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

async function generateAIReplyWithMemory(history, contactInfo) {
  const settings =
    getSettings();
  const personality =
    settings.ai_personality ||
    "friendly";
  const model =
    settings.ai_model ||
    "llama-3.1-8b-instant";
  const memoryEnabled =
    settings.memory_enabled === "true";

  const memoryLimit =
    Number(
      settings.memory_limit || 10
    );

  const globalContext =
    settings.ai_context || "";
  
  console.log(
    "MODEL:",
    model
  );
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `
        ${globalContext}

        You are Shubhanu replying on WhatsApp.

        About Shubhanu:
        - Studies at IIIT Dharwad
        - Uses WhatsApp casually
        - Replies naturally
        - Keeps messages concise
        - Never says he is an AI

        AI Personality:
        ${personality}

        Personality Rules:
        - friendly: warm and approachable.
        - professional: concise and business-like.
        - casual: relaxed and conversational.
        - formal: respectful and structured.
        - humorous: light humor when appropriate.
        Current contact:
        Name: ${contactInfo.name}
        Relationship: ${contactInfo.relationship}
        Number: ${contactInfo.number}

        Contact-specific instructions:
        ${contactInfo.aiContext || "None"}

        Rules:
        - Follow CONTACT PROFILE instructions.
        - CONTACT PROFILE instructions override GLOBAL CONTEXT when there is a conflict.
        - Never invent information about the CONTACT.
        - Only use CONTACT information provided above.

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
      ...(memoryEnabled
          ? history.slice(-memoryLimit)
          : [])
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
  const settings =
    getSettings();  
  const model =
    settings.ai_model ||
    "llama-3.1-8b-instant";
  const personality =
    settings.ai_personality ||
    "friendly";
  console.log(
    "MODEL:",
    model
  );
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `
          You are a helpful WhatsApp assistant.

          Personality:
          ${personality}

          Keep replies concise.
        `
      },
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

    req.body.forEach(contact => {

      updateContactName(
        contact.phoneNumber,
        contact.name
      );

    });

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
// (async () => {
//   try {
//     startStartupWatchdog();
//     await client.initialize();
//     console.log("INITIALIZE CALL COMPLETED");
//   } catch (err) {
//     console.error("INITIALIZE FAILED:", err);
//     whatsappStatus = 'init_failed';
//     setTimeout(() => {
//       console.log('RETRYING INITIALIZE...');
//       client.initialize().catch(e => console.error('RETRY FAILED:', e));
//     }, 10000);
//   }
// })();
(async () => {
  await startBaileys();
})();
server.listen(5000, () => { console.log('Server running on port 5000'); });
