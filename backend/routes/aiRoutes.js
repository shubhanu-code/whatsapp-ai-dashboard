const express = require("express");
const router = express.Router();

const { generateReply } = require("../services/aiService");

router.post("/reply", async (req, res) => {
  try {
    const { 
      message, 
      history = [], 
      contact = {}, 
      settings = null 
    } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "Missing or invalid message content." });
    }

    const aiResponse = await generateReply(message, history, contact, settings);

    // Matches the updated structure of aiService which yields both the payload and token analytics tracking metrics
    res.json({
      reply: aiResponse.reply,
      usage: aiResponse.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    });

  } catch (err) {
    console.error("AI ROUTE ROUTING ERROR:", err.message);

    res.status(500).json({
      reply: "Sorry, AI is unavailable.",
      error: err.message
    });
  }
});

module.exports = router;