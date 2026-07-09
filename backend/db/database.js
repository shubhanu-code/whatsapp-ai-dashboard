const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "whatsapp.db");
const db = new Database(dbPath);

console.log("DATABASE PATH:", dbPath);

// Enable Write-Ahead Logging for concurrent performance
db.pragma("journal_mode = WAL");

// 1. Core Schema Initialization
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

// 2. Safe Dynamic Column Migrations
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
    console.log(`Migration: Added column [${columnName}] to table [${tableName}]`);
  }
}

const migrations = [
  ["messages", "replySource", "TEXT"],
  ["messages", "aiProvider", "TEXT"],
  ["messages", "aiModel", "TEXT"],
  ["messages", "latencyMs", "INTEGER"],
  ["messages", "ruleId", "TEXT"],
  ["ai_usage", "provider", "TEXT"],
  ["ai_usage", "latencyMs", "INTEGER"]
];

migrations.forEach(([tableName, columnName, definition]) => {
  addColumnIfMissing(tableName, columnName, definition);
});

// 3. System Defaults Configuration
const defaultSettings = [
  ["ai_context", ""],
  ["memory_enabled", "true"],
  ["memory_limit", "10"],
  ["ai_personality", "friendly"]
];

const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO settings (key, value)
  VALUES (?, ?)
`);

// Execute system insertions within an explicit transaction performance block
db.transaction((settingsList) => {
  for (const [key, value] of settingsList) {
    insertSetting.run(key, value);
  }
})(defaultSettings);

// Log tables initialization overview
const tables = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table'
`).all();
console.log("INITIALIZED TABLES:", tables.map(t => t.name));

module.exports = db;