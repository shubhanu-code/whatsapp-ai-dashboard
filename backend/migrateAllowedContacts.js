const fs = require("fs");

const db = require("./db/database");

const FILE =
  "E:/projects/wa-data/allowedContacts.json";

const contacts = JSON.parse(
  fs.readFileSync(FILE, "utf8")
);

const insert = db.prepare(`
  INSERT OR REPLACE INTO allowed_contacts (
    whatsappId
  )
  VALUES (?)
`);

for (const contactId of contacts) {
  insert.run(contactId);
}

console.log(
  `Imported ${contacts.length} allowed contacts`
);