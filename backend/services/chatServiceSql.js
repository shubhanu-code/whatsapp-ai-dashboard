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

function deleteChat(contactId) {
  db.prepare(`
    DELETE FROM messages
    WHERE contactId = ?
  `).run(contactId);
}

function markChatRead(contactId) {

  db.prepare(`
    UPDATE messages
    SET read = 1
    WHERE contactId = ?
  `).run(contactId);

}

function markChatUnread(contactId) {

  db.prepare(`
    UPDATE messages
    SET read = 0
    WHERE contactId = ?
  `).run(contactId);

}

function deleteMessage(messageId) {

  db.prepare(`
    DELETE FROM messages
    WHERE id = ?
  `).run(messageId);

}

module.exports = {
  addMessage,
  getChats,
  deleteChat,
  markChatRead,
  markChatUnread,
  deleteMessage
};