require('dotenv').config();
const DATA_DIR = process.env.DATA_DIR || './wa-data';
const AUTH_DIR = process.env.AUTH_DIR || './wa-auth';
const BROWSER_PATH = process.env.BROWSER_PATH;
const Groq = require('groq-sdk');
const groq = new Groq({apiKey: process.env.GROQ_API_KEY});

console.log(
  "GROQ KEY:",
  process.env.GROQ_API_KEY
    ? "FOUND"
    : "MISSING"
);
const chatMemory = new Map();
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

async function generateAIReplyWithMemory(history) {

  const completion =
    await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content: `
You are Shubhanu's WhatsApp assistant.

Reply naturally.
Keep replies concise.
Respond as if chatting on WhatsApp.
`
        },

        ...history.slice(-12)
      ]
    });

  return completion.choices[0].message.content;
}

const app = express();

// FIX #10: Restrict CORS to your frontend origin only
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

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

let allowedContacts = safeReadJSON(`${DATA_DIR}/allowedContacts.json`,[]);
let contacts = safeReadJSON('${DATA_DIR}/contacts.json', []);
let settings = safeReadJSON('${DATA_DIR}/settings.json', { replyMode: 'smart'});
let rules = safeReadJSON('${DATA_DIR}/rules.json', []);

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
  safeWriteJSON('${DATA_DIR}/allowedContacts.json', allowedContacts);
  console.log('Allowed Contacts Saved:', allowedContacts.length);
  res.json({ success: true });
});
async function generateGroqReply(message) {

  const completion =
    await groq.chat.completions.create({
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

  return completion
    .choices[0]
    .message.content;
}

app.post('/ai-reply', async (req, res) => {

  const { message } = req.body;

  try {

    const reply =
      await generateGroqReply(
        message
      );

    res.json({
      reply
    });

  } catch (err) {

    console.error(
      "AI ERROR:",
      err
    );

    res.status(500).json({
      reply:
        "Sorry, AI is unavailable."
    });
  }
});

app.get('/contacts', (req, res) => {
  res.json(contacts);
});

app.post('/contacts', (req, res) => {
  contacts = req.body;

  console.log(
    'Contacts Saved:',
    contacts.length
  );

  safeWriteJSON('${DATA_DIR}/contacts.json', contacts);

  res.json({
    success: true
  });
});

app.get('/settings', (req, res) => {
  res.json(settings);
});

app.post('/settings', (req, res) => {
  settings = req.body;
  safeWriteJSON('${DATA_DIR}/settings.json', settings);
  console.log('NEW MODE:', settings.replyMode);
  res.json({ success: true });
});

app.get('/rules', (req, res) => {
  res.json(rules);
});

app.post('/rules', (req, res) => {
  rules = req.body;
  safeWriteJSON('${DATA_DIR}/rules.json', rules);
  console.log('Rules Saved:', rules.length);
  res.json({ success: true });
});

// ── WhatsApp Client ─────────────────────────────────────────────────────────

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: AUTH_DIR }), // ← change this to your own path
  
    puppeteer: {
    executablePath: BROWSER_PATH, // ← change if needed
    headless: false
  }
});

client.on('qr', qr => {
  console.log('QR GENERATED');
  qrcode.generate(qr, { small: true });
});

client.on('loading_screen', (percent, message) => {
  console.log('LOADING:', percent, message);
});

client.on('authenticated', () => {
  console.log('AUTHENTICATED');
  console.log('WAITING FOR READY...');
});
client.on('auth_failure', msg => {
  console.log('AUTH FAILURE:', msg);
});

client.on('disconnected', reason => {
  console.log('DISCONNECTED:', reason);
});

client.on('change_state', state => {
  console.log('STATE:', state);
});

client.on('ready', async () => {
  console.log('=== READY EVENT FIRED ===');
  try {
    const chats = await client.getChats();
    console.log('Chats Found:', chats.length);
  } catch (err) {
    console.error(err);
  }
});

client.on('message_create', msg => {
  console.log('MESSAGE_CREATE:', msg.body);
  console.log('FROMME:', msg.fromMe);
});

async function generateAIReply(history) {
  return await generateAIReplyWithMemory(history);
}

client.on('message', async msg => {

  if (msg.fromMe) {
    return;
  }

  const text = msg.body.toLowerCase();
  const sender = msg.from;

  console.log('FROM:', sender);
  console.log('MODE:', settings.replyMode);
  console.log('MESSAGE:', msg.body);

  const isAllowed = allowedContacts.some(contactId => {

    const normalize = (id) =>
      id.replace(
        /@(c\.us|lid|s\.whatsapp\.net)$/,
        ''
      );

    return (
      normalize(contactId) ===
      normalize(sender)
    );
  });

  if (!isAllowed) {
    console.log(
      'CONTACT NOT ALLOWED:',
      sender
    );
    return;
  }

  const matchedRule = rules.find(
    r =>
      r.isActive &&
      text.includes(
        r.keyword.toLowerCase()
      )
  );

  if (settings.replyMode === 'rules') {

    if (matchedRule) {
      await msg.reply(
        matchedRule.reply
      );
    }

    return;
  }

  if (settings.replyMode === 'ai') {

    if (!chatMemory.has(sender)) {
      chatMemory.set(sender, []);
    }

    const history = chatMemory.get(sender);

    history.push({
      role: "user",
      content: msg.body
    });

    const aiReply =
  await generateAIReplyWithMemory(history);

    history.push({
      role: "assistant",
      content: aiReply
    });

    if (history.length > 12) {
      history.splice(0, history.length - 12);
    }

    await msg.reply(aiReply);

    return;
  }

  if (settings.replyMode === 'smart') {

    if (matchedRule) {

      await msg.reply(
        matchedRule.reply
      );

      return;
    }

    if (!chatMemory.has(sender)) {
      chatMemory.set(sender, []);
    }

    const history = chatMemory.get(sender);

    history.push({
      role: "user",
      content: msg.body
    });

    const aiReply =
  await generateAIReplyWithMemory(history);

    history.push({
      role: "assistant",
      content: aiReply
    });

    if (history.length > 12) {
      history.splice(0, history.length - 12);
    }

    await msg.reply(
      aiReply
    );
  }

});


client.initialize();

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
