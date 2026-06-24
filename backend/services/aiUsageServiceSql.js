const db = require("../db/database");

function addUsage(data) {

  db.prepare(`
    INSERT INTO ai_usage (
      phoneNumber,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      timestamp
    )
    VALUES (
      @phoneNumber,
      @model,
      @promptTokens,
      @completionTokens,
      @totalTokens,
      @timestamp
    )
  `).run(data);

}

function getUsageStats() {

  return {
    totalTokens:
      db.prepare(`
        SELECT
          COALESCE(
            SUM(totalTokens),
            0
          ) as value
        FROM ai_usage
      `).get().value,

    totalRequests:
      db.prepare(`
        SELECT COUNT(*) as value
        FROM ai_usage
      `).get().value,

    averageTokens:
      db.prepare(`
        SELECT
          ROUND(
            AVG(totalTokens),
            0
          ) as value
        FROM ai_usage
      `).get().value,

    promptTokens:
      db.prepare(`
        SELECT
          COALESCE(
            SUM(promptTokens),
            0
          ) as value
        FROM ai_usage
      `).get().value,

    completionTokens:
      db.prepare(`
        SELECT
          COALESCE(
            SUM(completionTokens),
            0
          ) as value
        FROM ai_usage
      `).get().value
  };

}

module.exports = {
  addUsage,
  getUsageStats
};