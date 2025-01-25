const express = require('express');
const { generateAIResponse } = require('../services/openaiService');
const router = express.Router();

router.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await generateAIResponse(prompt);
    res.status(200).json({ response });
  } catch (error) {
    res.status(500).json({ error: 'AI request failed' });
  }
});

module.exports = router;
