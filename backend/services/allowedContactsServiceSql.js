const db = require("../db/database");

function getAllowedContacts() {

  return db
    .prepare(`
      SELECT whatsappId
      FROM allowed_contacts
    `)
    .all()
    .map(row => row.whatsappId);

}

function saveAllowedContacts(contacts) {

  const clear =
    db.prepare(
      "DELETE FROM allowed_contacts"
    );

  const insert =
    db.prepare(`
      INSERT INTO allowed_contacts (
        whatsappId
      )
      VALUES (?)
    `);

  const transaction =
    db.transaction(data => {

      clear.run();

      for (const contactId of data) {
        insert.run(contactId);
      }

    });

  transaction(contacts);
}

module.exports = {
  getAllowedContacts,
  saveAllowedContacts
};