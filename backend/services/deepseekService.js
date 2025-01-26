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


/**
 * Generate an AI social media post based on AI user's profile.
 * @param {Object} aiUser - AI user details
 * @returns {Promise<Object>} AI-generated post content.
 */
const generateAIPost = async (aiUser) => {
  try {
    const prompt = `
      Generate a social media post for an AI user named ${aiUser.firstName} ${aiUser.lastName}.
      The AI is an ${aiUser.occupation} from ${aiUser.nationality}.
      They are interested in ${aiUser.interests.join(", ")} and their personality traits include ${aiUser.personality.tagwords.join(", ")}.
      Generate a creative, engaging post relevant to their interests with a friendly and informative tone.

      Response should be in valid JSON format:
      {
        "text": "Generated AI post content",
        "image": "Optional image URL if applicable"
      }
      
      Ensure the response is valid JSON without any markdown, code block formatting, or extra comments.
    `;

    const response = await axios.post("http://127.0.0.1:11434/api/generate", {
      model: "deepseek-r1:1.5b",
      prompt: prompt,
      stream: false
    });

    let postResponse = response.data.response.trim();

    // Remove <think>...</think> block if present
    postResponse = postResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Cleanup accidental code block markers and newlines
    postResponse = postResponse.replace(/```json|```/g, '').trim();
    postResponse = postResponse.replace(/\n/g, '').trim();

    // Ensure response contains only JSON
    const aiPost = JSON.parse(postResponse);

    return aiPost;
  } catch (error) {
    console.error("Error generating AI post:", error.message);
    throw new Error("Failed to generate AI post");
  }
};

/**
 * Generate an AI comment based on AI user's profile and post content.
 * @param {Object} post - The post to be commented on.
 * @param {Object} aiUser - The AI user details.
 * @returns {Promise<Object>} AI-generated comment content.
 */
const generateAIComment = async (post, aiUser) => {
  try {
    const prompt = `
      Generate a friendly social media comment for the post: "${post.content.text}".
      The AI user ${aiUser.firstName} ${aiUser.lastName}, an ${aiUser.occupation} from ${aiUser.nationality},
      who is interested in ${aiUser.interests.join(", ")} should provide an insightful, engaging, and relevant comment.

      Response should be in valid JSON format:
      {
        "text": "Generated AI comment"
      }
      
      Ensure the response is valid JSON without any markdown or code block formatting.
    `;

    const response = await axios.post("http://127.0.0.1:11434/api/generate", {
      model: "deepseek-r1:1.5b",
      prompt: prompt,
      stream: false
    });

    let commentResponse = response.data.response.trim();

    // Remove <think>...</think> block if present
    commentResponse = commentResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Cleanup accidental code block markers and newlines
    commentResponse = commentResponse.replace(/```json|```/g, '').trim();
    commentResponse = commentResponse.replace(/\n/g, '').trim();

    // Ensure response contains only JSON
    const aiComment = JSON.parse(commentResponse);

    return aiComment;
  } catch (error) {
    console.error("Error generating AI comment:", error.message);
    throw new Error("Failed to generate AI comment");
  }
};
module.exports = { generateAIPost, generateAIUserUsingDeepseek,generateAIComment };
