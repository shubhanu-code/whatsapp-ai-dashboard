const express = require("express");
const router = express.Router();

const {
  getAllowedContacts,
  saveAllowedContacts
} = require("../services/allowedContactsServiceSql");

// GET /allowed-contacts
router.get("/", (req, res) => {
  try {
    res.json(getAllowedContacts());
  } catch (err) {
    console.error("GET /allowed-contacts Error:", err);
    res.status(500).json({
      error: "Failed to load allowed contacts"
    });
  }
});

// POST /allowed-contacts
router.post("/", (req, res) => {
  try {
    const allowedContactsArray = req.body;

    if (!Array.isArray(allowedContactsArray)) {
      return res.status(400).json({ 
        error: "Expected an array of allowed contacts." 
      });
    }

    saveAllowedContacts(allowedContactsArray);

    console.log("Allowed Contacts Saved:", allowedContactsArray.length);

    res.json({
      success: true
    });
  } catch (err) {
    console.error("POST /allowed-contacts Error:", err);
    res.status(500).json({
      error: "Failed to save allowed contacts"
    });
  }
});

module.exports = router;