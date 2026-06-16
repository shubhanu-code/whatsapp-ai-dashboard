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
    INSERT INTO contacts (
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
  `).run({
    ...contact,
    botEnabled: contact.botEnabled ? 1 : 0
  });
}

function saveContacts(contacts) {

  const clear =
    db.prepare(
      "DELETE FROM contacts"
    );

  const insert =
    db.prepare(`
      INSERT INTO contacts (
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

  const transaction =
    db.transaction(data => {

      clear.run();

      for (const contact of data) {

        insert.run({
          ...contact,
          botEnabled:
            contact.botEnabled ? 1 : 0
        });

      }

    });

  transaction(contacts);
}

function getContactByWhatsappId(
  whatsappId
) {

  return db.prepare(`
    SELECT *
    FROM contacts
    WHERE whatsappId = ?
  `).get(whatsappId);

}

module.exports = {
  getContacts,
  addContact,
  saveContacts,
  getContactByWhatsappId
};