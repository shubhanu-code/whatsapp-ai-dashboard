const db = require("../db/database");

function getMessages() {
  return db
    .prepare(`
      SELECT *
      FROM messages
      ORDER BY timestamp ASC
    `)
    .all();
}

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

module.exports = {
  getMessages,
  addMessage
};