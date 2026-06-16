const db = require("../db/database");

function addMessage(message) {
  db.prepare(`
    INSERT INTO messages (
      id,
      contactId,
      contactName,
      message,
      direction,
      timestamp,
      read
    )
    VALUES (
      @id,
      @contactId,
      @contactName,
      @message,
      @direction,
      @timestamp,
      @read
    )
  `).run({
    ...message,
    read: message.read ? 1 : 0
  });
}

function getChats() {
  return db
    .prepare(`
      SELECT *
      FROM messages
      ORDER BY timestamp ASC
    `)
    .all();
}

function saveChats() {
  // no-op for compatibility
}

function deleteChat(contactId) {
  db.prepare(`
    DELETE FROM messages
    WHERE contactId = ?
  `).run(contactId);
}

module.exports = {
  addMessage,
  getChats,
  saveChats,
  deleteChat
};