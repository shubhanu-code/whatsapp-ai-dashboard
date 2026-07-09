const express = require("express");
const router = express.Router();

const {
  getContacts,
  saveContacts
} = require("../services/contactServiceSql");

const {
  getContactIntelligence
} = require("../services/contactInsightsService");

const {
  updateContactName
} = require("../services/chatServiceSql");

// GET /api/contacts
router.get("/", (req, res) => {
  try {
    res.json(getContacts());
  } catch (err) {
    console.error("GET /contacts Error:", err);
    res.status(500).json({
      error: "Failed to load contacts"
    });
  }
});

// GET /api/contacts/:phoneNumber/intelligence
router.get("/:phoneNumber/intelligence", (req, res) => {
  try {
    const intelligence = getContactIntelligence(req.params.phoneNumber);
    res.json(intelligence);
  } catch (err) {
    console.error(`GET /contacts/${req.params.phoneNumber}/intelligence Error:`, err);
    res.status(500).json({
      error: "Failed to load contact intelligence."
    });
  }
});

// POST /api/contacts
router.post("/", (req, res) => {
  try {
    const contactsArray = req.body;
    
    // Safety check if payload isn't iterable
    if (!Array.isArray(contactsArray)) {
      return res.status(400).json({ error: "Expected an array of contacts." });
    }

    saveContacts(contactsArray);

    contactsArray.forEach(contact => {
      if (contact.phoneNumber && contact.name) {
        updateContactName(contact.phoneNumber, contact.name);
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("POST /contacts Error:", err);
    res.status(500).json({
      error: "Failed to save contacts"
    });
  }
});

module.exports = router;