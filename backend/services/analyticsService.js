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

module.exports = {
  getAnalytics
};