require('dotenv').config();
const startTime = Date.now();

// FIX: whatsapp-web.js has a known race where, on LOGOUT, WA Web reloads
// its page and the library's internal 'framenavigated' listener tries to
// re-inject helpers into a frame that destroy() has already detached.
// That throws "Attempted to use detached Frame" as an unhandled rejection
// we can't catch at the call site. It's harmless — the reconnect flow
// still proceeds — so just log it quietly instead of as an alarm.
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
  getChats
} = require("./services/chatService");
const chatRoutes = require("./routes/chatRoutes");

let isReinitializing = false;
let readyFired = false;
let authProcessed = false;
let whatsappStatus = 'starting';
let latestQR = null;

let startupWatchdog;

function startStartupWatchdog() {
  clearTimeout(startupWatchdog);

  startupWatchdog = setTimeout(async () => {
    if (whatsappStatus !== 'ready') {
      console.log('WARNING: Startup stalled, forcing restart');

      try {
        await client.destroy();
      } catch (e) {
        console.error('WATCHDOG DESTROY ERROR:', e);
      }

      readyFired = false;
      authProcessed = false;
      isReinitializing = false;
      whatsappStatus = 'restarting';

      client.initialize().catch(err => {
        console.error('WATCHDOG REINIT FAILED:', err);
      });
    }
  }, 20000); // give first-time sync more room than the old 60s
}

const DATA_DIR = process.env.DATA_DIR || './wa-data';
const AUTH_DIR = process.env.AUTH_DIR || './wa-auth';
const BROWSER_PATH = process.env.BROWSER_PATH;

// FIX: headless mode is now configurable via env var.
// Set WA_HEADLESS=true on servers without a display (uses the new headless mode).
// Leave unset for local development with a visible browser window.
const HEADLESS = process.env.WA_HEADLESS === 'true' ? 'new' : false;

const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log(
  "GROQ KEY:",
  process.env.GROQ_API_KEY ? "FOUND" : "MISSING"
);

const chatMemory = new Map();
const fs = require('fs');
const path = require("path");
const express = require('express');
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

        - Mother/Father/Parent:
          Be warm, respectful and caring.

        - Brother/Sister/Cousin:
          Be casual and friendly.

        - College Friend:
          Be relaxed, informal and natural.

        - Classmate:
          Be helpful and collaborative.

        - Recruiter:
          Be professional and polite.

        - Faculty:
          Be respectful and concise.

        - Unknown:
          Be friendly and neutral.

        Reply as Shubhanu would.
        `
      },

      ...history.slice(-12)
    ]
  });

  return completion.choices[0].message.content;
}

const app = express();

// Ensure data directories exist before trying to read/write files
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// FIX #10: Restrict CORS to your frontend origin only
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use("/chats", chatRoutes);

// FIX #8: Safe file reads — server won't crash if JSON files are missing
function safeReadJSON(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.warn(`Could not read ${filePath}, using fallback. Error: ${err.message}`);
    return fallback;
  }
}

// FIX #9: Atomic file write — prevents data loss if write is interrupted
function safeWriteJSON(filePath, data) {
  const tmpPath = filePath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, filePath);
}

let allowedContacts = safeReadJSON(
  path.join(DATA_DIR, "allowedContacts.json"),
  []
);

let contacts = safeReadJSON(
  path.join(DATA_DIR, "contacts.json"),
  []
);

let settings = safeReadJSON(
  path.join(DATA_DIR, "settings.json"),
  { replyMode: "smart" }
);

let rules = safeReadJSON(
  path.join(DATA_DIR, "rules.json"),
  []
);

console.log('SETTINGS LOADED:', settings);
console.log('RULES LOADED:', rules.length);
console.log('ALLOWED CONTACTS LOADED:', allowedContacts.length);
console.log('CONTACTS LOADED:', contacts.length);

// ── Routes ─────────────────────────────────────────────────────────────────

app.get('/allowed-contacts', (req, res) => {
  res.json(allowedContacts);
});

app.post('/allowed-contacts', (req, res) => {
  allowedContacts = req.body;
  safeWriteJSON(
    path.join(DATA_DIR, "allowedContacts.json"),
    allowedContacts
  );
  console.log('Allowed Contacts Saved:', allowedContacts.length);
  res.json({ success: true });
});

async function generateGroqReply(message) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful WhatsApp assistant. Keep replies short and friendly."
      },
      {
        role: "user",
        content: message
      }
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
  res.json(contacts);
});

app.post('/contacts', (req, res) => {
  contacts = req.body;

  console.log('Contacts Saved:', contacts.length);

  safeWriteJSON(
    path.join(DATA_DIR, "contacts.json"),
    contacts
  );

  res.json({ success: true });
});

app.get('/settings', (req, res) => {
  res.json(settings);
});

app.post('/settings', (req, res) => {
  settings = req.body;
  safeWriteJSON(
    path.join(DATA_DIR, "settings.json"),
    settings
  );
  console.log('NEW MODE:', settings.replyMode);
  res.json({ success: true });
});

app.get('/rules', (req, res) => {
  res.json(rules);
});

app.post('/rules', (req, res) => {
  rules = req.body;
  safeWriteJSON(
    path.join(DATA_DIR, "rules.json"),
    rules
  );
  console.log('Rules Saved:', rules.length);
  res.json({ success: true });
});

app.get('/status', (req, res) => {
  res.json({
    whatsappStatus,
    hasQR: !!latestQR
  });
});

// ── WhatsApp Client ─────────────────────────────────────────────────────────

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'main',
    dataPath: AUTH_DIR
  }),

  puppeteer: {
    executablePath: BROWSER_PATH,
    headless: HEADLESS, // FIX: configurable — see WA_HEADLESS above
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
  isReinitializing = false; // FIX: a fresh QR means we made it past reinit

  console.log('QR GENERATED');

  qrcode.generate(qr, { small: true });
});

client.on('loading_screen', (percent, message) => {
  console.log('LOADING:', percent, message);
  startStartupWatchdog(); // FIX: keep extending the watchdog while sync progresses
});

client.on('authenticated', () => {
  if (authProcessed) {
    return;
  }

  authProcessed = true;

  console.log('AUTHENTICATED');
});

client.on('auth_failure', async msg => {
  console.log('AUTH FAILURE:', msg);
  whatsappStatus = 'auth_failure';
});

// FIX: disconnected now actually cleans up before reconnecting.
// - destroy() the dead client/browser before calling initialize() again,
//   so we never reuse a half-alive puppeteer session.
// - on a phone-side LOGOUT, wipe the saved session so whatsapp-web.js is
//   forced into a clean QR flow instead of trying (and failing) to resume
//   a session that no longer exists server-side. This is what was causing
//   stray "ready" events after logging out.
client.on('disconnected', async reason => {
  whatsappStatus = 'disconnected';
  readyFired = false;
  authProcessed = false;

  console.log('DISCONNECTED:', reason);

  if (isReinitializing) {
    return;
  }

  isReinitializing = true;

  // FIX: remove whatsapp-web.js's internal page listeners before destroying.
  // This stops its 'framenavigated' handler from firing mid-teardown and
  // racing with destroy() (see the unhandledRejection note at the top of
  // this file for why that race happens).
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

client.on('change_state', state => {
  console.log('STATE:', state);
});

client.on('ready', () => {
  if (readyFired) {
    return;
  }

  readyFired = true;
  isReinitializing = false; // FIX: clear the reinit latch once fully back up

  clearTimeout(startupWatchdog);

  whatsappStatus = 'ready';

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('=== READY EVENT FIRED ===');
  console.log(`READY after ${seconds}s`);
});

client.on('message_create', msg => {
  console.log('MESSAGE_CREATE:', msg.body);
  console.log('FROMME:', msg.fromMe);
});

client.on('message', msg => {
  console.log('MESSAGE EVENT:', msg.body);
});

client.on('message_reaction', () => {
  console.log('REACTION EVENT');
});

client.on('message', async msg => {
  if (msg.fromMe) {
    return;
  }

  const text = msg.body.toLowerCase();
  const sender = msg.from;

  const contact = await msg.getContact();

  const savedContact = contacts.find(
    c => c.whatsappId === sender
  );

  const contactInfo = {
    name:
      savedContact?.name ||
      contact.pushname ||
      contact.name ||
      "Unknown",

    relationship:
      savedContact?.relationship ||
      "Unknown",

    number: sender
  };

  addMessage({
    id: Date.now().toString(),
    contactId: sender,
    contactName: contactInfo.name,
    message: msg.body,
    direction: "incoming",
    timestamp: new Date().toISOString()
  });

  const exists = contacts.some(
    c => c.whatsappId === sender
  );

  if (!exists) {
    contacts.push({
      id: Date.now().toString(),
      name: contactInfo.name,
      phone: "",
      whatsappId: sender,
      botEnabled: false,
      relationship: "Unknown"
    });

    safeWriteJSON(
      path.join(DATA_DIR, "contacts.json"),
      contacts
    );

    console.log("NEW CONTACT SAVED:", contactInfo.name);
  }

  console.log('FROM:', sender);
  console.log('MODE:', settings.replyMode);
  console.log('MESSAGE:', msg.body);

  const isAllowed = allowedContacts.some(contactId => {
    const normalize = (id) =>
      id.replace(/@(c\.us|lid|s\.whatsapp\.net)$/, '');

    return normalize(contactId) === normalize(sender);
  });

  if (!isAllowed) {
    console.log('CONTACT NOT ALLOWED:', sender);
    return;
  }

  const matchedRule = rules.find(r => {
    if (!r.isActive) return false;

    const msgText = text.trim();
    const keyword = (r.keyword || '').toLowerCase().trim();

    if (r.matchType === 'exact') {
      return msgText === keyword;
    }
    return msgText.includes(keyword);
  });

  if (settings.replyMode === 'rules') {
    if (matchedRule) {
      await msg.reply(matchedRule.reply);

      addMessage({
        id: Date.now().toString(),
        contactId: sender,
        contactName: contactInfo.name,
        message: matchedRule.reply,
        direction: "outgoing",
        timestamp: new Date().toISOString()
      });
    }

    return;
  }

  if (settings.replyMode === 'ai') {
    if (!chatMemory.has(sender)) {
      chatMemory.set(sender, []);
    }

    const history = chatMemory.get(sender);

    history.push({ role: "user", content: msg.body });

    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    try {
      const aiReply = await generateAIReplyWithMemory(history, contactInfo);

      history.push({ role: "assistant", content: aiReply });

      await msg.reply(aiReply);

      addMessage({
        id: Date.now().toString(),
        contactId: sender,
        contactName: contactInfo.name,
        message: aiReply,
        direction: "outgoing",
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("AI REPLY ERROR:", err);

      await msg.reply("Sorry, I'm having trouble replying right now.");
    }

    return;
  }

  if (settings.replyMode === 'smart') {
    if (matchedRule) {
      await msg.reply(matchedRule.reply);

      addMessage({
        id: Date.now().toString(),
        contactId: sender,
        contactName: contactInfo.name,
        message: matchedRule.reply,
        direction: "outgoing",
        timestamp: new Date().toISOString()
      });

      return;
    }

    if (!chatMemory.has(sender)) {
      chatMemory.set(sender, []);
    }

    const history = chatMemory.get(sender);

    history.push({ role: "user", content: msg.body });

    try {
      const aiReply = await generateAIReplyWithMemory(history, contactInfo);

      history.push({ role: "assistant", content: aiReply });

      await msg.reply(aiReply);

      // FIX: 'smart' mode AI replies were never logged to chat history before
      addMessage({
        id: Date.now().toString(),
        contactId: sender,
        contactName: contactInfo.name,
        message: aiReply,
        direction: "outgoing",
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("AI REPLY ERROR:", err);
    }
  }
});

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

      client.initialize().catch(e =>
        console.error('RETRY FAILED:', e)
      );
    }, 10000);
  }
})();

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
