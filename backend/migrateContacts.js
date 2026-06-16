const fs = require("fs");
const path = require("path");

const db = require("./db/database");

const CONTACTS_FILE =
  "E:/projects/wa-data/contacts.json";

const contacts = JSON.parse(
  fs.readFileSync(CONTACTS_FILE, "utf8")
);

const insert = db.prepare(`
  INSERT OR REPLACE INTO contacts (
    id,
    name,
    phone,
    relationship,
    whatsappId,
    botEnabled
  )
  VALUES (
    @id,
    @name,
    @phone,
    @relationship,
    @whatsappId,
    @botEnabled
  )
`);

const transaction = db.transaction(data => {

  for (const contact of data) {

    insert.run({
      id: contact.id,
      name: contact.name || "Unknown",
      phone: contact.phone || "",
      relationship:
        contact.relationship || "Unknown",
      whatsappId:
        contact.whatsappId || null,
      botEnabled:
        contact.botEnabled ? 1 : 0
    });

  }

});

transaction(contacts);

console.log(
  `Imported ${contacts.length} contacts`
);