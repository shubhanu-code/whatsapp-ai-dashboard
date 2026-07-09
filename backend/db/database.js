const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
  path.join(__dirname, "whatsapp.db")
);
console.log(
  "DATABASE PATH:",
  path.join(__dirname, "whatsapp.db")
);
const tables =
  db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type='table'
  `).all();

console.log(
  "TABLES:",
  tables
);

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS contacts (
  phoneNumber TEXT PRIMARY KEY,
  waJid TEXT,
  waLid TEXT,
  name TEXT,
  relationship TEXT DEFAULT 'Unknown',
  aiContext TEXT DEFAULT '',
  botEnabled INTEGER DEFAULT 0,
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  phoneNumber TEXT,
  waJid TEXT,
  waLid TEXT,
  contactName TEXT,
  message TEXT,
  direction TEXT,
  timestamp TEXT,
  read INTEGER DEFAULT 0,
  replySource TEXT,
  aiProvider TEXT,
  aiModel TEXT,
  latencyMs INTEGER,
  ruleId TEXT
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
  phoneNumber TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS conversations (
  phoneNumber TEXT PRIMARY KEY,
  pinned INTEGER DEFAULT 0,
  favorite INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phoneNumber TEXT,
  model TEXT,
  provider TEXT,
  promptTokens INTEGER,
  completionTokens INTEGER,
  totalTokens INTEGER,
  latencyMs INTEGER,
  timestamp TEXT
);
`);

function addColumnIfMissing(tableName, columnName, definition) {
  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .map(column => column.name);

  if (!columns.includes(columnName)) {
    db.prepare(`
      ALTER TABLE ${tableName}
      ADD COLUMN ${columnName} ${definition}
    `).run();
  }
}

[
  ["messages", "replySource", "TEXT"],
  ["messages", "aiProvider", "TEXT"],
  ["messages", "aiModel", "TEXT"],
  ["messages", "latencyMs", "INTEGER"],
  ["messages", "ruleId", "TEXT"],
  ["ai_usage", "provider", "TEXT"],
  ["ai_usage", "latencyMs", "INTEGER"]
].forEach(([tableName, columnName, definition]) => {
  addColumnIfMissing(tableName, columnName, definition);
});

try {

  db.prepare(`
    ALTER TABLE contacts
    ADD COLUMN aiContext TEXT DEFAULT ''
  `).run();

} catch {}

db.prepare(`
  INSERT OR IGNORE INTO settings
  (key,value)
  VALUES
  ('ai_context','')
`).run();

db.prepare(`
  INSERT OR IGNORE INTO settings
  (key,value)
  VALUES
  ('memory_enabled','true')
`).run();

db.prepare(`
  INSERT OR IGNORE INTO settings
  (key,value)
  VALUES
  ('memory_limit','10')
`).run();

db.prepare(`
  INSERT OR IGNORE INTO settings
  (key,value)
  VALUES
  ('ai_personality','friendly')
`).run();

module.exports = db;
