const express = require("express");
const router = express.Router();

const {
  getAnalytics,
  getMessageBreakdown,
  getPeakHours,
  getDailyActivity,
} = require("../services/analyticsService");
const {
  getRecentTokenUsage
} = require("../services/analyticsRepository");

const {
  getUsageStats,
  getTopContacts,
  getAIAnalytics,
} = require("../services/aiUsageServiceSql");

// Helper
function jsonRoute(fn, errorMsg) {
  return (req, res) => {
    try {
      res.json(fn(req));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: errorMsg });
    }
  };
}

// Routes
router.get("/", jsonRoute(() => getAnalytics(), "Failed to load analytics"));

router.get(
  "/breakdown",
  jsonRoute(() => getMessageBreakdown(), "Failed to load breakdown")
);

router.get(
  "/peak-hours",
  jsonRoute(() => getPeakHours(), "Failed to load peak hours")
);

router.get(
  "/daily-activity",
  jsonRoute(() => getDailyActivity(), "Failed to load activity")
);

router.get(
  "/top-contacts",
  jsonRoute(() => getTopContacts(), "Failed to load contacts")
);

router.get(
  "/ai",
  jsonRoute(() => getAIAnalytics(), "Failed to load AI analytics")
);

router.get(
  "/tokens",
  jsonRoute(() => getUsageStats(), "Failed to load token stats")
);

router.get("/token-usage", (_req, res) => {
  res.json(getRecentTokenUsage());
});

module.exports = router;
