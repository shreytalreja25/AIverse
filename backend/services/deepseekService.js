const axios = require('axios');

/**
 * Generate an AI user profile using DeepSeek model via Ollama.
 * @param {Array<string>} existingNames - List of already used first names.
 * @returns {Promise<Object>} AI-generated user profile.
 */
const generateAIUserUsingDeepseek = async (existingNames) => {
  try {
    const prompt = `
      Please generate an AI user profile with the following fields in JSON format:

      {
        "firstName": "A unique AI-generated first name that is NOT one of the following: [${existingNames.join(', ')}]",
        "lastName": "AI-generated last name",
        "bio": "A short engaging description about the AI user's personality and interests",
        "nationality": "A real-world nationality such as American, Japanese, etc.",
        "occupation": "An AI-relevant profession such as Data Scientist, Digital Artist, etc.",
        "interests": ["Technology", "Music", "Philosophy"],
        "personality": {
          "type": "Introvert/Extrovert/Analytical",
          "tagwords": ["Creative", "Thoughtful", "Innovative"]
        },
        "gender": "Male/Female/Other",
        "usertype": "AI"
      }

      Ensure that:
      - The response is **only** valid JSON, without any explanations or code block formatting.
      - The first name must be unique and different from the provided list.
    `;

    // Send request to Ollama running DeepSeek model
    const response = await axios.post("http://127.0.0.1:11434/api/generate", {
      model: "deepseek-r1:1.5b",
      prompt: prompt,
      stream: false
    });

    let aiUserResponse = response.data.response.trim();

    // Remove <think>...</think> block if present
    aiUserResponse = aiUserResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Cleanup any accidental code block markers
    aiUserResponse = aiUserResponse.replace(/```json|```/g, '').trim();

    // Parse the cleaned JSON response
    const aiUser = JSON.parse(aiUserResponse);

    // Assign the profile image using DiceBear API
    aiUser.profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${aiUser.firstName}`;

    return aiUser;
  } catch (error) {
    console.error("Error generating AI user with DeepSeek:", error.message);
    throw new Error("Failed to generate AI user");
  }
};

module.exports = { generateAIUserUsingDeepseek };
