const db = require("../db/database");

function getContacts() {
  return db
    .prepare(`
      SELECT *
      FROM contacts
      ORDER BY name
    `)
    .all()
    .map(contact => ({
      ...contact,
      botEnabled: Boolean(contact.botEnabled)
    }));
}

function addContact(contact) {
  db.prepare(`
    INSERT OR REPLACE INTO contacts (
      phoneNumber,
      waJid,
      waLid,
      name,
      relationship,
      aiContext,
      botEnabled,
      createdAt
    )
    VALUES (
      @phoneNumber,
      @waJid,
      @waLid,
      @name,
      @relationship,
      @aiContext,
      @botEnabled,
      @createdAt
    )
  `).run({
    ...contact,
    relationship: contact.relationship || "Unknown",
    aiContext: contact.aiContext || "",
    botEnabled: contact.botEnabled ? 1 : 0
  });
}

function saveContacts(contacts) {
  const clear = db.prepare("DELETE FROM contacts");

  const insert = db.prepare(`
    INSERT OR REPLACE INTO contacts (
      phoneNumber,
      waJid,
      waLid,
      name,
      relationship,
      aiContext,
      botEnabled,
      createdAt
    )
    VALUES (
      @phoneNumber,
      @waJid,
      @waLid,
      @name,
      @relationship,
      @aiContext,
      @botEnabled,
      @createdAt
    )
  `);

  const transaction = db.transaction(data => {
    clear.run();
    for (const contact of data) {
      insert.run({
        ...contact,
        relationship: contact.relationship || "Unknown",
        aiContext: contact.aiContext || "",
        botEnabled: contact.botEnabled ? 1 : 0
      });
    }
  });

  transaction(contacts);
}

function getContactByPhone(phoneNumber) {
  const contact = db.prepare(`
    SELECT *
    FROM contacts
    WHERE phoneNumber = ?
  `).get(phoneNumber);

  if (!contact) return null;

  return {
    ...contact,
    botEnabled: Boolean(contact.botEnabled)
  };
}

module.exports = {
  getContacts,
  addContact,
  saveContacts,
  getContactByPhone
};