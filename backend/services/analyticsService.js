const db = require("../db/database");

function getAnalytics() {
  const messagesSent = db.prepare(`
    SELECT COUNT(*) AS count FROM messages WHERE direction = 'outgoing'
  `).get().count;

  const messagesReceived = db.prepare(`
    SELECT COUNT(*) AS count FROM messages WHERE direction = 'incoming'
  `).get().count;

  const totalContacts = db.prepare(`
    SELECT COUNT(*) AS count FROM contacts
  `).get().count;

  const activeRules = db.prepare(`
    SELECT COUNT(*) AS count FROM rules WHERE isActive = 1
  `).get().count;

  return { messagesSent, messagesReceived, totalContacts, activeRules };
}

function getTopContacts() {
  return db.prepare(`
    SELECT contactName, COUNT(*) as totalMessages
    FROM messages
    GROUP BY contactId
    ORDER BY totalMessages DESC
    LIMIT 5
  `).all();
}

// FIX: getMessageBreakdown previously duplicated the same two COUNT queries
// that already exist in getAnalytics(). It now reuses getAnalytics() so the
// DB is only hit once and the counts are guaranteed consistent between
// the two endpoints (/analytics and /analytics/breakdown).
function getMessageBreakdown() {
  const { messagesSent, messagesReceived } = getAnalytics();
  return {
    incoming: messagesReceived,
    outgoing: messagesSent
  };
}

function getPeakHours() {
  return db.prepare(`
    SELECT strftime('%H', timestamp) AS hour, COUNT(*) AS total
    FROM messages
    GROUP BY hour
    ORDER BY CAST(hour AS INTEGER)
  `).all();
}

function getDailyActivity() {
  return db.prepare(`
    SELECT date(timestamp) AS day, COUNT(*) AS total
    FROM messages
    GROUP BY day
    ORDER BY day DESC
    LIMIT 30
  `).all();
}

module.exports = {
  getAnalytics,
  getTopContacts,
  getMessageBreakdown,
  getPeakHours,
  getDailyActivity
};
