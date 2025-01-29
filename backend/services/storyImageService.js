const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const serverAddress = "127.0.0.1:8188";

/**
 * Generate a story image using ComfyUI based on user and story text.
 * @param {Object} user - The AI user details.
 * @param {string} storyText - The AI-generated story text content.
 * @returns {Promise<string>} - The public URL of the generated story image.
 */
const generateStoryImage = async (user, storyText) => {
  return new Promise((resolve, reject) => {
    try {
      const clientId = require('crypto').randomUUID();
      const userId = user._id ? user._id.toString() : `${user.firstName}_${user.lastName}`;
      const ws = new WebSocket(`ws://${serverAddress}/ws?clientId=${clientId}`);

      // ComfyUI workflow for generating story images
      const workflow = {
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
            "seed": Math.floor(Math.random() * 1000000),
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
            "text": `
              Create a story image for ${user.firstName} ${user.lastName}, a ${user.occupation} from ${user.nationality}.
              Their interests include ${user.interests.join(", ")}.
              The story text: "${storyText}".
              Use a vibrant, dynamic style aligned with their personality: ${user.personality.type}.
            `,
          },
        },
        "7": {
          "class_type": "CLIPTextEncode",
          "inputs": {
            "clip": ["4", 1],
            "text": "blurry, bad quality, bad lighting",
          },
        },
        "8": {
          "class_type": "VAEDecode",
          "inputs": { "samples": ["3", 0], "vae": ["4", 2] },
        },
        "9": {
          "class_type": "SaveImage",
          "inputs": {
            "filename_prefix": `${userId}_StoryImage`,
            "images": ["8", 0],
          },
        },
      };

      console.log('Workflow Payload Sent to ComfyUI:', JSON.stringify(workflow, null, 2));

      // Send request to ComfyUI
      axios.post(`http://${serverAddress}/prompt`, {
        prompt: workflow,
        client_id: clientId,
      })
        .then(response => {
          const promptId = response.data.prompt_id;
          console.log('Queued Prompt ID:', promptId);

          ws.on('message', async (data) => {
            const message = JSON.parse(data);

            if (message.type === 'executing' && message.data.node === null && message.data.prompt_id === promptId) {
              console.log('Execution complete for Prompt ID:', promptId);
              ws.close();

              const historyResponse = await axios.get(`http://${serverAddress}/history/${promptId}`);
              const history = historyResponse.data[promptId]?.outputs || {};

              for (const nodeId in history) {
                const nodeOutput = history[nodeId];
                if (nodeOutput.images) {
                  for (const image of nodeOutput.images) {
                    const imageData = await axios.get(
                      `http://${serverAddress}/view?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}`,
                      { responseType: 'arraybuffer' }
                    );

                    const outputDir = path.join(__dirname, '../outputs', userId);
                    if (!fs.existsSync(outputDir)) {
                      fs.mkdirSync(outputDir, { recursive: true });
                    }
                    const outputPath = path.join(outputDir, `${userId}_StoryImage.png`);
                    fs.writeFileSync(outputPath, imageData.data);

                    const publicUrl = `http://localhost:5000/profile-images/${userId}/${userId}_StoryImage.png`;
                    resolve(publicUrl);
                    return;
                  }
                }
              }

              reject(new Error('No images found in ComfyUI response history'));
            }
          });
        })
        .catch(error => {
          console.error('Error sending request to ComfyUI:', error.message);
          reject(error);
        });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error.message);
        reject(error);
      });

    } catch (error) {
      console.error('Error generating story image:', error.message);
      reject(error);
    }
  });
};

module.exports = { generateStoryImage };
