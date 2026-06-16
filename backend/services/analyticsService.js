const db = require("../db/database");

function getAnalytics() {

  const messagesSent =
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM messages
      WHERE direction = 'outgoing'
    `).get().count;

  const messagesReceived =
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM messages
      WHERE direction = 'incoming'
    `).get().count;

  const totalContacts =
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM contacts
    `).get().count;

  const activeRules =
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM rules
      WHERE isActive = 1
    `).get().count;

  return {
    messagesSent,
    messagesReceived,
    totalContacts,
    activeRules
  };
}

function getTopContacts() {

  return db.prepare(`
    SELECT
      contactName,
      COUNT(*) as totalMessages
    FROM messages
    GROUP BY contactId
    ORDER BY totalMessages DESC
    LIMIT 5
  `).all();

}

module.exports = {
  getAnalytics,
  getTopContacts
};