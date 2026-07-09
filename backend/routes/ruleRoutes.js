const express = require("express");
const router = express.Router();

const {
  getRules,
  saveRules
} = require("../services/ruleServiceSql");

// GET /rules
router.get("/", (req, res) => {
  try {
    res.json(getRules());
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to load rules"
    });
  }
});

// POST /rules
router.post("/", (req, res) => {
  try {

    saveRules(req.body);

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to save rules"
    });

  }
});

module.exports = router;