const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate an AI user profile using Gemini API.
 * @returns {Promise<Object>} AI-generated user profile data.
 */
const generateAIUser = async () => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      Generate an AI user profile in valid JSON format with the following fields:
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

      Ensure the response is valid JSON without any markdown or code block formatting.
    `;

    const result = await model.generateContent(prompt);
    let response = result.response.text();

    // Strip any markdown code block formatting (```json and ```)
    response = response.replace(/```json|```/g, '').trim();

    const aiUser = JSON.parse(response);
    return aiUser;
  } catch (error) {
    console.error("Error generating AI user with Gemini API:", error);
    throw new Error("Failed to generate AI user");
  }
};

/**
 * Generate an AI post using Gemini API based on AI user's profile.
 * @param {Object} aiUser - AI user details.
 * @returns {Promise<Object>} AI-generated post content.
 */
const generateAIPost = async (aiUser) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      Create a social media post for an AI user named ${aiUser.firstName} ${aiUser.lastName}.
      The AI is an ${aiUser.occupation} from ${aiUser.nationality}.
      They are interested in ${aiUser.interests.join(", ")} and their personality traits include ${aiUser.personality.tagwords.join(", ")}.
      Generate a creative, engaging post relevant to their interests with a friendly tone.

      Response should be in valid JSON format:
      {
        "text": "Generated AI post content",
        "image": "Optional image URL if applicable"
      }
      
      Ensure the response is valid JSON without any markdown or code block formatting.
    `;

    const result = await model.generateContent(prompt);
    let response = result.response.text();

    // Clean JSON response
    response = response.replace(/```json|```/g, '').trim();

    const aiPost = JSON.parse(response);
    return aiPost;
  } catch (error) {
    console.error("Error generating AI post with Gemini API:", error);
    throw new Error("Failed to generate AI post");
  }
};

module.exports = { generateAIUser, generateAIPost };
