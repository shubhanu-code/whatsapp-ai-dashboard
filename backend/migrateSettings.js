const fs = require("fs");

const db = require("./db/database");

const SETTINGS_FILE =
  "E:/projects/wa-data/settings.json";

const settings = JSON.parse(
  fs.readFileSync(
    SETTINGS_FILE,
    "utf8"
  )
);

const insert = db.prepare(`
  INSERT OR REPLACE INTO settings (
    key,
    value
  )
  VALUES (?, ?)
`);

for (const [key, value] of Object.entries(settings)) {

  insert.run(
    key,
    String(value)
  );

}

console.log(
  "Imported settings"
);