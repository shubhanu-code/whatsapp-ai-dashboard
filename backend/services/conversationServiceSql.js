const db = require("../db/database");

function getConversation(contactId) {
  return db.prepare(`
    SELECT *
    FROM conversations
    WHERE contactId = ?
  `).get(contactId);
}

function getAllConversations() {

  const rows = db.prepare(`
    SELECT *
    FROM conversations
  `).all();

  const map = {};

  rows.forEach(row => {

    map[row.contactId] = {
      pinned: Boolean(row.pinned),
      favorite: Boolean(row.favorite)
    };

  });

  return map;

}

function ensureConversation(contactId) {

  db.prepare(`
    INSERT OR IGNORE INTO conversations (
      contactId
    )
    VALUES (?)
  `).run(contactId);

}

function togglePin(contactId) {

  ensureConversation(contactId);

  db.prepare(`
    UPDATE conversations
    SET pinned =
      CASE
        WHEN pinned = 1 THEN 0
        ELSE 1
      END
    WHERE contactId = ?
  `).run(contactId);

}

function toggleFavorite(contactId) {

  ensureConversation(contactId);

  db.prepare(`
    UPDATE conversations
    SET favorite =
      CASE
        WHEN favorite = 1 THEN 0
        ELSE 1
      END
    WHERE contactId = ?
  `).run(contactId);

}

module.exports = {
  getConversation,
  getAllConversations,
  togglePin,
  toggleFavorite
};
