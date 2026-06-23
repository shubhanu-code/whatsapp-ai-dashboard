const db = require("../db/database");

function addMessage(message) {
  db.prepare(`
    INSERT OR IGNORE INTO messages (
      id,
      phoneNumber,
      waJid,
      waLid,
      contactName,
      message,
      direction,
      timestamp,
      read
    )
    VALUES (
      @id,
      @phoneNumber,
      @waJid,
      @waLid,
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

function getRecentMessages(
  phoneNumber,
  limit = 10
) {

  return db.prepare(`
    SELECT *
    FROM messages
    WHERE phoneNumber = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `)
  .all(phoneNumber, limit)
  .reverse();

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

function deleteChat(phoneNumber) {
  db.prepare(`
    DELETE FROM messages
    WHERE phoneNumber = ?
  `).run(phoneNumber);
}

function markChatRead(phoneNumber) {
  db.prepare(`
    UPDATE messages
    SET read = 1
    WHERE phoneNumber = ?
  `).run(phoneNumber);
}

function markChatUnread(phoneNumber) {
  db.prepare(`
    UPDATE messages
    SET read = 0
    WHERE phoneNumber = ?
  `).run(phoneNumber);
}

function updateContactName(
  phoneNumber,
  name
) {

  db.prepare(`
    UPDATE messages
    SET contactName = ?
    WHERE phoneNumber = ?
  `).run(
    name,
    phoneNumber
  );

}

function deleteMessage(messageId) {

  db.prepare(`
    DELETE FROM messages
    WHERE id = ?
  `).run(messageId);

}

function messageExists(id) {

  const row =
    db.prepare(`
      SELECT id
      FROM messages
      WHERE id = ?
    `).get(id);

  return !!row;

}

module.exports = {
  addMessage,
  getChats,
  deleteChat,
  markChatRead,
  markChatUnread,
  deleteMessage,
  messageExists,
  getRecentMessages,
  updateContactName

};