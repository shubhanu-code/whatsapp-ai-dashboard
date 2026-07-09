const db = require("../db/database");
const {
  getTokenUsageStats,
  getTopContacts: getRepositoryTopContacts,
  getAIUsageOverview,
  getAIUsagePerformance,
  getModelUsage
} = require("./analyticsRepository");

function addUsage(data) {
  db.prepare(`
    INSERT INTO ai_usage (
      phoneNumber,
      model,
      provider,
      promptTokens,
      completionTokens,
      totalTokens,
      latencyMs,
      timestamp
    )
    VALUES (
      @phoneNumber,
      @model,
      @provider,
      @promptTokens,
      @completionTokens,
      @totalTokens,
      @latencyMs,
      @timestamp
    )
  `).run({
    ...data,
    provider: data.provider || data.aiProvider || null,
    latencyMs: data.latencyMs || null
  });
}

function getUsageStats() {
  return getTokenUsageStats();
}

function getTopContacts() {
  return getRepositoryTopContacts();
}

function getAIAnalytics() {
  const overview = getAIUsageOverview();

  const tokenBreakdown = {
    promptTokens: overview.promptTokens,
    completionTokens: overview.completionTokens,
    promptPercent:
      overview.totalTokens === 0
        ? 0
        : Number(
            (
              (overview.promptTokens / overview.totalTokens) * 100
            ).toFixed(1)
          ),

    completionPercent:
      overview.totalTokens === 0
        ? 0
        : Number(
            (
              (overview.completionTokens / overview.totalTokens) * 100
            ).toFixed(1)
          )
  };

  const aiHealth = {
    status: "Excellent",
    efficiency:
      overview.totalTokens === 0
        ? 0
        : Number(
            (
              (overview.promptTokens / overview.totalTokens) * 100
            ).toFixed(1)
          ),
    activeModels: overview.modelsUsed
  };

  const modelUsage = getModelUsage();
  const performance = getAIUsagePerformance();
  const topContacts = getTopContacts();

  return {
    overview,
    tokenBreakdown,
    topContacts,
    modelUsage,
    performance,
    aiHealth
  };
}

module.exports = {
  addUsage,
  getUsageStats,
  getTopContacts,
  getAIAnalytics
};