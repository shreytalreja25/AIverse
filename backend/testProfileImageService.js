const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const serverAddress = "127.0.0.1:8188";
const clientId = require('crypto').randomUUID(); // Generate a unique client ID

/**
 * Queue the prompt by sending it to the ComfyUI `/prompt` endpoint.
 * @param {Object} prompt - The workflow JSON object.
 * @returns {Promise<Object>} - The response from the ComfyUI server.
 */
async function queuePrompt(prompt) {
  try {
    const response = await axios.post(`http://${serverAddress}/prompt`, {
      prompt: prompt,
      client_id: clientId,
    });
    return response.data; // Contains prompt_id
  } catch (error) {
    console.error('Error queuing prompt:', error.message);
    throw error;
  }
}

/**
 * Retrieve the execution history for a specific prompt ID.
 * @param {string} promptId - The ID of the prompt to retrieve history for.
 * @returns {Promise<Object>} - The history data from the ComfyUI server.
 */
async function getHistory(promptId) {
  try {
    const response = await axios.get(`http://${serverAddress}/history/${promptId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error.message);
    throw error;
  }
}

/**
 * Retrieve an image from the ComfyUI server.
 * @param {string} filename - The name of the image file.
 * @param {string} subfolder - The subfolder where the image is stored.
 * @param {string} folderType - The folder type (e.g., "outputs").
 * @returns {Promise<Buffer>} - The image data as a Buffer.
 */
async function getImage(filename, subfolder, folderType) {
  try {
    const params = new URLSearchParams({ filename, subfolder, type: folderType });
    const response = await axios.get(`http://${serverAddress}/view?${params.toString()}`, {
      responseType: 'arraybuffer',
    });
    return response.data;
  } catch (error) {
    console.error('Error retrieving image:', error.message);
    throw error;
  }
}

/**
 * Main function to execute the workflow and fetch the generated images.
 * @param {Object} user - The AI user details.
 * @param {Object} promptTemplate - The workflow JSON object.
 */
async function executeWorkflow(user, promptTemplate) {
  const ws = new WebSocket(`ws://${serverAddress}/ws?clientId=${clientId}`);

  ws.on('open', async () => {
    try {
      // Prepare the prompt with user data
      promptTemplate["6"]["inputs"]["text"] = `
        Portrait of an AI-generated persona named ${user.firstName} ${user.lastName}.
        Depict them as ${user.gender} with a ${user.personality.type} personality,
        showcasing traits such as ${user.personality.tagwords.join(", ")}.
        They are a ${user.occupation} with interests in ${user.interests.join(", ")}.
        Their nationality is ${user.nationality}, and their bio describes them as: '${user.bio}'.
        The image should embody their essence, combining elements of ${user.interests.join(", ")} 
        and their analytical and creative nature.
        Use a futuristic, artistic style with an abstract and glowing technological background,
        emphasizing a futuristic yet approachable vibe.
        Ensure soft and dynamic lighting to highlight key features.
      `;
      const queuedPrompt = await queuePrompt(promptTemplate);
      const promptId = queuedPrompt.prompt_id;

      console.log('Queued Prompt ID:', promptId);

      ws.on('message', async (data) => {
        const message = JSON.parse(data);

        if (message.type === 'executing' && message.data.node === null && message.data.prompt_id === promptId) {
          console.log('Execution complete for Prompt ID:', promptId);

          ws.close(); // Close WebSocket connection after execution

          // Fetch history to get image outputs
          const history = await getHistory(promptId);
          const outputs = history[promptId]?.outputs || {};

          for (const nodeId in outputs) {
            const nodeOutput = outputs[nodeId];
            if (nodeOutput.images) {
              for (const image of nodeOutput.images) {
                const imageData = await getImage(image.filename, image.subfolder, image.type);

                // Save image to /outputs/{userId}/{userId}_PFP.png
                const outputDir = path.join(__dirname, 'outputs', user._id.$oid);
                if (!fs.existsSync(outputDir)) {
                  fs.mkdirSync(outputDir, { recursive: true });
                }
                const outputPath = path.join(outputDir, `${user._id.$oid}_PFP.png`);
                fs.writeFileSync(outputPath, imageData);
                console.log('Image saved to:', outputPath);
              }
            }
          }
          console.log('Workflow execution complete.');
        }
      });
    } catch (error) {
      console.error('Error during workflow execution:', error.message);
      ws.close();
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
}

// Sample user data
const user = {
  _id: { $oid: "679844b9a37f8b2e606dc4f4" },
  firstName: "Nexy",
  lastName: "Aixer",
  bio: "Nexy is an AI-driven individual with a unique blend of creativity and analytical thinking. As a Data Scientist at the University of Technology, Nexy brings fresh perspectives to complex problems. He thrives on collaboration, often inspiring his team to explore innovative solutions together.",
  nationality: "American",
  occupation: "Data Scientist",
  interests: ["Technology", "Music", "Philosophy"],
  personality: {
    type: "Introvert/Extrovert/Analytical",
    tagwords: ["Creative", "Thoughtful", "Innovative"],
  },
  gender: "Male",
  usertype: "AI",
};

// Workflow JSON
const promptTemplate = {
  "3": {
    "class_type": "KSampler",
    "inputs": {
      "cfg": 8,
      "denoise": 1,
      "latent_image": ["5", 0],
      "model": ["4", 0],
      "negative": ["7", 0],
      "positive": ["6", 0],
      "sampler_name": "euler",
      "scheduler": "normal",
      "seed": 8566257,
      "steps": 20,
    },
  },
  "4": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": { "ckpt_name": "epiCrealism.safetensors" },
  },
  "5": {
    "class_type": "EmptyLatentImage",
    "inputs": { "batch_size": 1, "height": 512, "width": 512 },
  },
  "6": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "clip": ["4", 1],
      "text": "",
    },
  },
  "7": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "clip": ["4", 1],
      "text": "bad hands",
    },
  },
  "8": {
    "class_type": "VAEDecode",
    "inputs": { "samples": ["3", 0], "vae": ["4", 2] },
  },
  "9": {
    "class_type": "SaveImage",
    "inputs": { "filename_prefix": "JS_ComfyUI", "images": ["8", 0] },
  },
};

// Execute the workflow with the user data
executeWorkflow(user, promptTemplate);
