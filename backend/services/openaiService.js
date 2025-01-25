const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate an AI user profile using OpenAI.
 * @returns {Promise<Object>} AI-generated user profile data.
 */
const generateAIUser = async () => {
  try {
    const prompt = `
      Generate an AI user profile with the following attributes in JSON format:
      {
        "firstName": "AI-generated first name",
        "lastName": "AI-generated last name",
        "bio": "A short description about the AI user",
        "nationality": "Nationality of the AI",
        "occupation": "AI-generated occupation",
        "interests": ["Interest 1", "Interest 2", "Interest 3"],
        "personality": {
          "type": "Introvert/Extrovert/Analytical/etc.",
          "tagwords": ["Creative", "Thoughtful", "Innovative"]
        },
        "gender": "Male/Female/Other",
        "usertype": "AI"
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // Use "gpt-3.5-turbo" for cost savings if preferred
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500
    });

    const generatedData = JSON.parse(response.choices[0].message.content);
    return generatedData;
  } catch (error) {
    console.error('Error generating AI user:', error);
    throw new Error('Failed to generate AI user');
  }
};

module.exports = { generateAIUser };
