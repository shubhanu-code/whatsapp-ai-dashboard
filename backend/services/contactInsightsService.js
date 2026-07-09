const { getContactByPhone } = require("./contactServiceSql");
const {
  getMessageCounts,
  getFirstAndLastMessage,
  getTokenStats: getRepositoryTokenStats,
  getActivityStats: getRepositoryActivityStats,
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
  getAIUsageOverview,
  getAIUsagePerformance
} = require("./analyticsRepository");

const PERIODS = [
  "hour",
  "today",
  "week",
  "month",
  "year",
  "lifetime"
];

function round(value) {
  return Math.round(value || 0);
}

function getConversationDays(firstMessage) {
  if (!firstMessage) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(firstMessage).getTime()) /
      (1000 * 60 * 60 * 24)
    )
  );
}

function getAverageMessagesPerDay(total, firstMessage) {
  if (!firstMessage) {
    return 0;
  }

  const days = Math.max(
    1,
    Math.ceil(
      (Date.now() - new Date(firstMessage).getTime()) /
      (1000 * 60 * 60 * 24)
    )
  );

  return Number((total / days).toFixed(2));
}

function getOverview(phoneNumber) {
  const contact = getContactByPhone(phoneNumber);
  const range = getFirstAndLastMessage({ phoneNumber });

  return {
    phoneNumber,
    name: contact?.name || "Unknown",
    relationship: contact?.relationship || "Unknown",
    botEnabled: Boolean(contact?.botEnabled),
    aiProfile: contact?.aiContext || "",
    firstMessage: range.firstMessage || null,
    lastMessage: range.lastMessage || null,
    conversationDays: getConversationDays(range.firstMessage)
  };
}

function getMessageStats(phoneNumber) {
  const stats = getMessageCounts({ phoneNumber });
  const range = getFirstAndLastMessage({ phoneNumber });
  const replyBreakdown = getReplyBreakdown({ phoneNumber });

  const replyCounts = replyBreakdown.reduce((counts, row) => ({
    ...counts,
    [row.name]: row.value
  }), {});

  return {
    total: stats.total || 0,
    incoming: stats.incoming || 0,
    outgoing: stats.outgoing || 0,
    averageMessagesPerDay:
      getAverageMessagesPerDay(stats.total || 0, range.firstMessage),
    averageIncomingLength: round(stats.avgIncomingLength),
    averageOutgoingLength: round(stats.avgOutgoingLength),
    manualReplies: replyCounts.manual || 0,
    aiReplies: replyCounts.ai || 0,
    ruleReplies: replyCounts.rule || 0,
    replyBreakdown
  };
}

function getTokenStats(phoneNumber) {
  return PERIODS.reduce((stats, period) => {
    const row = getRepositoryTokenStats({
      phoneNumber,
      period
    });

    return {
      ...stats,
      [period]: {
        replies: row.replies || 0,
        promptTokens: row.promptTokens || 0,
        completionTokens: row.completionTokens || 0,
        totalTokens: row.totalTokens || 0,
        averageTokens: round(row.averageTokens),
        averageLatencyMs: round(row.averageLatencyMs)
      }
    };
  }, {});
}

function getActivityStats(phoneNumber) {
  return PERIODS.reduce((stats, period) => {
    const row = getRepositoryActivityStats({
      phoneNumber,
      period
    });

    return {
      ...stats,
      [period]: {
        total: row.total || 0,
        incoming: row.incoming || 0,
        outgoing: row.outgoing || 0
      }
    };
  }, {});
}

function getAIStats(phoneNumber) {
  return {
    overview: getAIUsageOverview({ phoneNumber }),
    providers: getProviderUsage({ phoneNumber }),
    models: getModelUsage({ phoneNumber }),
    performance: getAIUsagePerformance({ phoneNumber })
  };
}

function getMemory(phoneNumber) {
  const contact = getContactByPhone(phoneNumber);

  return {
    enabled: Boolean(contact?.aiContext),
    profile: contact?.aiContext || "",
    relationship: contact?.relationship || "Unknown",
    updatedAt: null
  };
}

function getConversationSummary(phoneNumber) {
  const conversation = getConversationStats({ phoneNumber });
  const range = getFirstAndLastMessage({ phoneNumber });

  return {
    status: conversation.messages > 0 ? "active" : "empty",
    totalMessages: conversation.messages || 0,
    firstMessage: range.firstMessage || null,
    lastMessage: range.lastMessage || null,
    lastGeneratedAt: null,
    text: ""
  };
}

function getGraphs(phoneNumber) {
  const scope = { phoneNumber };

  return {
    hourlyTrend: getHourlyTrend(scope),
    dailyTrend: getDailyTrend(scope),
    weeklyTrend: getWeeklyTrend(scope),
    monthlyTrend: getMonthlyTrend(scope),
    yearlyTrend: getYearlyTrend(scope),
    weekdayDistribution: getWeekdayDistribution(scope),
    heatmap: getHourlyHeatmap(scope),
    tokenHourlyTrend: getTokenTrend(scope, "hour", 24),
    tokenDailyTrend: getTokenTrend(scope, "day", 30),
    tokenWeeklyTrend: getTokenTrend(scope, "week", 26),
    tokenMonthlyTrend: getTokenTrend(scope, "month", 24),
    tokenYearlyTrend: getTokenTrend(scope, "year", 10),
    providerUsage: getProviderUsage(scope),
    modelUsage: getModelUsage(scope),
    replyBreakdown: getReplyBreakdown(scope)
  };
}

function getContactIntelligence(phoneNumber) {
  return {
    overview: getOverview(phoneNumber),
    messages: getMessageStats(phoneNumber),
    tokens: getTokenStats(phoneNumber),
    activity: getActivityStats(phoneNumber),
    ai: getAIStats(phoneNumber),
    memory: getMemory(phoneNumber),
    summary: getConversationSummary(phoneNumber),
    graphs: getGraphs(phoneNumber)
  };
}

module.exports = {
  getContactIntelligence
};
