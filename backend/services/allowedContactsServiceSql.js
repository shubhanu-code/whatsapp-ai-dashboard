const db = require("../db/database");

function getAllowedContacts() {

  return db
    .prepare(`
      SELECT phoneNumber
      FROM allowed_contacts
    `)
    .all()
    .map(row => row.phoneNumber);

}

function saveAllowedContacts(contacts) {

  const clear =
    db.prepare(
      "DELETE FROM allowed_contacts"
    );

  const insert =
    db.prepare(`
      INSERT INTO allowed_contacts (
        phoneNumber
      )
      VALUES (?)
    `);

  const transaction =
    db.transaction(data => {

      clear.run();

      for (const phoneNumber of data) {
        insert.run(phoneNumber);
      }

    });

  transaction(contacts);
}

module.exports = {
  getAllowedContacts,
  saveAllowedContacts
};