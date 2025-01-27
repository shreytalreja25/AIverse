const axios = require('axios');

/**
 * Safely cleans and extracts JSON from a string.
 * - Removes <think> blocks.
 * - Removes ```json or ``` markers.
 * - Removes newline characters.
 * - Extracts only the text from the first '{' to the matching last '}'.
 *
 * @param {string} rawResponse - The raw text response from the model.
 * @returns {string} A valid JSON string (or best attempt).
 */
function cleanAndExtractJSON(rawResponse) {
  // Remove <think>...</think>
  let cleaned = rawResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  // Remove code block markers
  cleaned = cleaned.replace(/```json|```/g, '').trim();
  // Remove newlines
  cleaned = cleaned.replace(/\r?\n|\r/g, '').trim();

  // Now extract only the portion from the first '{' to the final '}'
  const firstBracketIndex = cleaned.indexOf('{');
  const lastBracketIndex = cleaned.lastIndexOf('}');

  if (firstBracketIndex !== -1 && lastBracketIndex !== -1 && lastBracketIndex > firstBracketIndex) {
    cleaned = cleaned.slice(firstBracketIndex, lastBracketIndex + 1);
  }

  return cleaned;
}

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

    let aiUserResponse = cleanAndExtractJSON(response.data.response);

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

    let postResponse = cleanAndExtractJSON(response.data.response);

    const aiPost = JSON.parse(postResponse);
    return aiPost;
  } catch (error) {
    console.error("Error generating AI post:", error.message);
    throw new Error("Failed to generate AI post");
  }
};

/**
 * Generate an AI-generated story for social media based on the AI user's profile.
 * @param {Object} aiUser - AI user details
 * @returns {Promise<Object>} AI-generated story content.
 */
const generateAIStory = async (aiUser) => {
  try {
    const prompt = `
      Generate an engaging social media story for an AI user named ${aiUser.firstName} ${aiUser.lastName}.
      The AI is an ${aiUser.occupation} from ${aiUser.nationality} and their interests include ${aiUser.interests.join(", ")}.
      The story should be visually appealing and include a short caption related to their interests.

      Response should be in valid JSON format:
      {
        "image": "A relevant image URL",
        "caption": "Generated AI story caption"
      }

      Ensure the response is valid JSON without any markdown, code block formatting, or extra comments.
    `;

    const response = await axios.post("http://127.0.0.1:11434/api/generate", {
      model: "deepseek-r1:1.5b",
      prompt: prompt,
      stream: false
    });

    let storyResponse = cleanAndExtractJSON(response.data.response);

    const aiStory = JSON.parse(storyResponse);
    return aiStory;
  } catch (error) {
    console.error("Error generating AI story:", error.message);
    throw new Error("Failed to generate AI story");
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

    let commentResponse = cleanAndExtractJSON(response.data.response);

    const aiComment = JSON.parse(commentResponse);
    return aiComment;
  } catch (error) {
    console.error("Error generating AI comment:", error.message);
    throw new Error("Failed to generate AI comment");
  }
};

/**
 * Generate an AI reply based on AI user's profile and comment content.
 * @param {Object} comment - The comment to reply to.
 * @param {Object} aiUser - The AI user details.
 * @returns {Promise<Object>} AI-generated reply content.
 */
const generateAIReply = async (comment, aiUser) => {
  try {
    const prompt = `
      Generate a friendly reply to the following comment: "${comment.text}".
      The AI user ${aiUser.firstName} ${aiUser.lastName}, an ${aiUser.occupation} from ${aiUser.nationality},
      who is interested in ${aiUser.interests.join(", ")} should provide an insightful, engaging, and relevant reply.

      Response should be in valid JSON format:
      {
        "text": "Generated AI reply"
      }
      
      Ensure the response is valid JSON without any markdown or code block formatting.
    `;

    const response = await axios.post("http://127.0.0.1:11434/api/generate", {
      model: "deepseek-r1:1.5b",
      prompt: prompt,
      stream: false
    });

    let replyResponse = cleanAndExtractJSON(response.data.response);

    const aiReply = JSON.parse(replyResponse);
    return aiReply;
  } catch (error) {
    console.error("Error generating AI reply:", error.message);
    throw new Error("Failed to generate AI reply");
  }
};

module.exports = {
  generateAIPost,
  generateAIUserUsingDeepseek,
  generateAIComment,
  generateAIReply,
  generateAIStory
};
