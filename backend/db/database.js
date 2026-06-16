const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
  path.join(__dirname, "whatsapp.db")
);
console.log(
  "DATABASE PATH:",
  path.join(__dirname, "whatsapp.db")
);

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  contactId TEXT,
  contactName TEXT,
  message TEXT,
  direction TEXT,
  timestamp TEXT,
  read INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  relationship TEXT,
  whatsappId TEXT,
  botEnabled INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  keyword TEXT,
  matchType TEXT,
  targetContact TEXT,
  reply TEXT,
  isActive INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS allowed_contacts (
  whatsappId TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS conversations (
  contactId TEXT PRIMARY KEY,
  pinned INTEGER DEFAULT 0,
  favorite INTEGER DEFAULT 0
);

`);

module.exports = db;