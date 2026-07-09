const {
  getMessageCounts,
  getTotalContacts,
  getActiveRules,
  getHourlyTrend,
  getDailyTrend
} = require("./analyticsRepository");

function getAnalytics() {
  const counts = getMessageCounts();

  return {
    messagesSent: counts.outgoing || 0,
    messagesReceived: counts.incoming || 0,
    totalContacts: getTotalContacts() || 0,
    activeRules: getActiveRules() || 0
  };
}

function getMessageBreakdown() {
  const { messagesSent, messagesReceived } = getAnalytics();

  return {
    incoming: messagesReceived,
    outgoing: messagesSent
  };
}

function getPeakHours() {
  const hourlyData = getHourlyTrend();
  
  if (!Array.isArray(hourlyData)) return [];
  
  return hourlyData.map(row => ({
    hour: row.hour,
    total: row.total || 0
  }));
}

function getDailyActivity() {
  const dailyData = getDailyTrend();
  return Array.isArray(dailyData) ? dailyData : [];
}

module.exports = {
  getAnalytics,
  getMessageBreakdown,
  getPeakHours,
  getDailyActivity
};