const db = require("../db/database");

function castValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !isNaN(value)) return Number(value);
  return value;
}

function getSettings() {
  const rows = db.prepare(`SELECT * FROM settings`).all();
  const settings = {};

  for (const row of rows) {
    settings[row.key] = castValue(row.value);
  }

  return settings;
}

function saveSettings(settings) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO settings (key, value)
    VALUES (?, ?)
  `);

  const transaction = db.transaction(data => {
    for (const [key, value] of Object.entries(data)) {
      insert.run(key, String(value));
    }
  });

  transaction(settings);
}

module.exports = {
  getSettings,
  saveSettings
};