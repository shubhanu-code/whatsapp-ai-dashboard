const express = require("express");
const router = express.Router();

const {
  getSettings,
  saveSettings
} = require("../services/settingsServiceSql");

// GET /settings
router.get("/", (req, res) => {
  try {

    res.json(
      getSettings()
    );

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to load settings"
    });

  }
});

// POST /settings
router.post("/", (req, res) => {
  try {

    console.log(
      "SETTINGS RECEIVED:",
      req.body
    );

    saveSettings(req.body);

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to save settings"
    });

  }
});

module.exports = router;