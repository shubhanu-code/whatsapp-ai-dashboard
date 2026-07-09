const db = require("../db/database");

const PERIODS = {
  hour: "-1 hour",
  today: "-1 day",
  day: "-1 day",
  week: "-7 day",
  month: "-1 month",
  year: "-1 year"
};

function normalizeScope(scope) {
  if (typeof scope === "string") {
    return { phoneNumber: scope };
  }
  return scope || {};
}

function getPeriodInterval(period) {
  if (!period || period === "lifetime") {
    return null;
  }
  return PERIODS[period] || null;
}

function scopedWhere(scope, tableAlias) {
  const filters = normalizeScope(scope);
  const prefix = tableAlias ? `${tableAlias}.` : "";
  const clauses = [];
  const params = {};

  if (filters.phoneNumber) {
    clauses.push(`${prefix}phoneNumber = @phoneNumber`);
    params.phoneNumber = filters.phoneNumber;
  }

  if (filters.period && filters.period !== "lifetime") {
    const interval = getPeriodInterval(filters.period);
    if (interval) {
      clauses.push(`datetime(${prefix}timestamp) >= datetime('now', @interval)`);
      params.interval = interval;
    }
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params
  };
}

function getMessageCounts(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END), 0) AS incoming,
      COALESCE(SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END), 0) AS outgoing,
      AVG(CASE WHEN direction = 'incoming' THEN LENGTH(message) END) AS avgIncomingLength,
      AVG(CASE WHEN direction = 'outgoing' THEN LENGTH(message) END) AS avgOutgoingLength
    FROM messages
    ${query.where}
  `).get(query.params);
}

function getFirstAndLastMessage(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      MIN(timestamp) AS firstMessage,
      MAX(timestamp) AS lastMessage
    FROM messages
    ${query.where}
  `).get(query.params);
}

function getTokenStats(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      COUNT(*) AS replies,
      COALESCE(SUM(promptTokens), 0) AS promptTokens,
      COALESCE(SUM(completionTokens), 0) AS completionTokens,
      COALESCE(SUM(totalTokens), 0) AS totalTokens,
      AVG(totalTokens) AS averageTokens,
      AVG(latencyMs) AS averageLatencyMs
    FROM ai_usage
    ${query.where}
  `).get(query.params);
}

function getActivityStats(scope) {
  return getMessageCounts(scope);
}

function getReplyBreakdown(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      COALESCE(replySource, 'unknown') AS name,
      COUNT(*) AS value
    FROM messages
    ${query.where}
    GROUP BY COALESCE(replySource, 'unknown')
    ORDER BY value DESC
  `).all(query.params);
}

function getProviderUsage(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      COALESCE(provider, 'unknown') AS provider,
      COUNT(*) AS requests,
      COALESCE(SUM(totalTokens), 0) AS totalTokens,
      ROUND(AVG(totalTokens), 0) AS averageTokens,
      ROUND(AVG(latencyMs), 0) AS averageLatencyMs
    FROM ai_usage
    ${query.where}
    GROUP BY COALESCE(provider, 'unknown')
    ORDER BY requests DESC
  `).all(query.params);
}

function getModelUsage(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      COALESCE(model, 'unknown') AS model,
      COUNT(*) AS requests,
      COALESCE(SUM(totalTokens), 0) AS totalTokens
    FROM ai_usage
    ${query.where}
    GROUP BY COALESCE(model, 'unknown')
    ORDER BY requests DESC
  `).all(query.params);
}

function getHourlyHeatmap(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      CAST(strftime('%w', timestamp) AS INTEGER) AS weekday,
      CAST(strftime('%H', timestamp) AS INTEGER) AS hour,
      COUNT(*) AS total
    FROM messages
    ${query.where}
    GROUP BY weekday, hour
    ORDER BY weekday, hour
  `).all(query.params);
}

function getHourlyTrend(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      strftime('%H', timestamp) AS hour,
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END), 0) AS incoming,
      COALESCE(SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END), 0) AS outgoing
    FROM messages
    ${query.where}
    GROUP BY hour
    ORDER BY CAST(hour AS INTEGER)
  `).all(query.params);
}

function getDailyTrend(scope, limit = 30) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      date(timestamp) AS day,
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END), 0) AS incoming,
      COALESCE(SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END), 0) AS outgoing
    FROM messages
    ${query.where}
    GROUP BY day
    ORDER BY day DESC
    LIMIT @limit
  `).all({
    ...query.params,
    limit
  });
}

function getWeeklyTrend(scope, limit = 26) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      strftime('%Y-W%W', timestamp) AS week,
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END), 0) AS incoming,
      COALESCE(SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END), 0) AS outgoing
    FROM messages
    ${query.where}
    GROUP BY week
    ORDER BY week DESC
    LIMIT @limit
  `).all({
    ...query.params,
    limit
  });
}

function getMonthlyTrend(scope, limit = 24) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      strftime('%Y-%m', timestamp) AS month,
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END), 0) AS incoming,
      COALESCE(SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END), 0) AS outgoing
    FROM messages
    ${query.where}
    GROUP BY month
    ORDER BY month DESC
    LIMIT @limit
  `).all({
    ...query.params,
    limit
  });
}

function getYearlyTrend(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      strftime('%Y', timestamp) AS year,
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END), 0) AS incoming,
      COALESCE(SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END), 0) AS outgoing
    FROM messages
    ${query.where}
    GROUP BY year
    ORDER BY year DESC
  `).all(query.params);
}

function getWeekdayDistribution(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      CAST(strftime('%w', timestamp) AS INTEGER) AS weekday,
      COUNT(*) AS total
    FROM messages
    ${query.where}
    GROUP BY weekday
    ORDER BY weekday
  `).all(query.params);
}

function getTokenTrend(scope, bucket, limit = 30) {
  const labels = {
    hour: "strftime('%Y-%m-%d %H:00', timestamp)",
    day: "date(timestamp)",
    week: "strftime('%Y-W%W', timestamp)",
    month: "strftime('%Y-%m', timestamp)",
    year: "strftime('%Y', timestamp)"
  };
  const label = labels[bucket] || labels.day;
  const query = scopedWhere(scope);

  return db.prepare(`
    SELECT
      ${label} AS period,
      COUNT(*) AS replies,
      COALESCE(SUM(promptTokens), 0) AS promptTokens,
      COALESCE(SUM(completionTokens), 0) AS completionTokens,
      COALESCE(SUM(totalTokens), 0) AS totalTokens
    FROM ai_usage
    ${query.where}
    GROUP BY period
    ORDER BY period DESC
    LIMIT @limit
  `).all({
    ...query.params,
    limit
  });
}

function getConversationStats(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      COUNT(DISTINCT phoneNumber) AS conversations,
      COUNT(*) AS messages,
      MAX(timestamp) AS lastMessageAt
    FROM messages
    ${query.where}
  `).get(query.params);
}

function getTotalContacts() {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM contacts
  `).get().count;
}

function getActiveRules() {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM rules
    WHERE isActive = 1
  `).get().count;
}

function getTokenUsageStats(scope) {
  const stats = getTokenStats(scope);
  return {
    totalTokens: stats.totalTokens || 0,
    totalRequests: stats.replies || 0,
    averageTokens: Math.round(stats.averageTokens || 0),
    promptTokens: stats.promptTokens || 0,
    completionTokens: stats.completionTokens || 0
  };
}

function getTopContacts(limit = 10) {
  return db.prepare(`
    SELECT
      c.phoneNumber,
      COALESCE(c.name, 'Unknown') AS name,
      COALESCE(c.relationship, 'Unknown') AS relationship,
      COUNT(a.id) AS requests,
      COALESCE(SUM(a.promptTokens), 0) AS promptTokens,
      COALESCE(SUM(a.completionTokens), 0) AS completionTokens,
      COALESCE(SUM(a.totalTokens), 0) AS totalTokens,
      ROUND(AVG(a.totalTokens), 0) AS averageTokens
    FROM ai_usage a
    LEFT JOIN contacts c
      ON a.phoneNumber = c.phoneNumber
    GROUP BY a.phoneNumber
    ORDER BY totalTokens DESC
    LIMIT ?
  `).all(limit);
}

function getAIUsageOverview(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      COUNT(*) AS totalRequests,
      COALESCE(SUM(promptTokens), 0) AS promptTokens,
      COALESCE(SUM(completionTokens), 0) AS completionTokens,
      COALESCE(SUM(totalTokens), 0) AS totalTokens,
      ROUND(AVG(totalTokens), 0) AS averageTokens,
      COUNT(DISTINCT model) AS modelsUsed,
      COUNT(DISTINCT provider) AS providersUsed,
      ROUND(AVG(latencyMs), 0) AS averageLatencyMs
    FROM ai_usage
    ${query.where}
  `).get(query.params);
}

function getAIUsagePerformance(scope) {
  const query = scopedWhere(scope);
  return db.prepare(`
    SELECT
      ROUND(AVG(promptTokens), 0) AS averagePrompt,
      ROUND(AVG(completionTokens), 0) AS averageCompletion,
      MAX(promptTokens) AS maxPrompt,
      MAX(completionTokens) AS maxCompletion,
      MIN(promptTokens) AS minPrompt,
      MIN(completionTokens) AS minCompletion,
      ROUND(AVG(latencyMs), 0) AS averageLatencyMs,
      MAX(latencyMs) AS maxLatencyMs,
      MIN(latencyMs) AS minLatencyMs
    FROM ai_usage
    ${query.where}
  `).get(query.params);
}

function getRecentTokenUsage(limit = 20) {
  return db.prepare(`
    SELECT *
    FROM ai_usage
    ORDER BY id DESC
    LIMIT ?
  `).all(limit);
}

module.exports = {
  getMessageCounts,
  getFirstAndLastMessage,
  getTokenStats,
  getActivityStats,
  getHourlyHeatmap,
  getHourlyTrend,
  getDailyTrend,
  getWeeklyTrend,
  getMonthlyTrend,
  getYearlyTrend,
  getWeekdayDistribution,
  getTokenTrend,
  getProviderUsage,
  getModelUsage,
  getReplyBreakdown,
  getConversationStats,
  getTotalContacts,
  getActiveRules,
  getTokenUsageStats,
  getTopContacts,
  getAIUsageOverview,
  getAIUsagePerformance,
  getRecentTokenUsage
};