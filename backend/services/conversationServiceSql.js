const db = require("../db/database");

function getConversation(phoneNumber) {
  return db.prepare(`
    SELECT *
    FROM conversations
    WHERE phoneNumber = ?
  `).get(phoneNumber);
}

function getAllConversations() {

  const rows = db.prepare(`
    SELECT *
    FROM conversations
  `).all();

  const map = {};

  rows.forEach(row => {

    map[row.phoneNumber] = {
      pinned: Boolean(row.pinned),
      favorite: Boolean(row.favorite)
    };

  });

  return map;

}

function ensureConversation(phoneNumber) {

  db.prepare(`
    INSERT OR IGNORE INTO conversations (
      phoneNumber
    )
    VALUES (?)
  `).run(phoneNumber);

}

function togglePin(phoneNumber) {
  ensureConversation(phoneNumber);

  db.prepare(`
    UPDATE conversations
    SET pinned = CASE
      WHEN pinned = 1 THEN 0
      ELSE 1
    END
    WHERE phoneNumber = ?
  `).run(phoneNumber);

  return getConversation(phoneNumber);
}

function toggleFavorite(phoneNumber) {

  ensureConversation(phoneNumber);

  db.prepare(`
    UPDATE conversations
    SET favorite =
      CASE
        WHEN favorite = 1 THEN 0
        ELSE 1
      END
    WHERE phoneNumber = ?
  `).run(phoneNumber);

}

module.exports = {
  getConversation,
  getAllConversations,
  togglePin,
  toggleFavorite
};