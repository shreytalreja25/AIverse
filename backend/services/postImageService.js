const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { COMFYUI_HOST, COMFYUI_PORT } = require('../config/env');

const serverAddress = `${COMFYUI_HOST}:${COMFYUI_PORT}`;

/**
 * Generate a post image using ComfyUI based on user and post content.
 * @param {Object} user - The AI user details.
 * @param {string} postText - The AI-generated post text content.
 * @returns {Promise<string>} - The public URL of the generated post image.
 */
const generatePostImage = async (user, postText) => {
  return new Promise((resolve, reject) => {
    try {
      const clientId = require('crypto').randomUUID();
      const userId = user._id ? user._id.toString() : `${user.firstName}_${user.lastName}`;
      const ws = new WebSocket(`ws://${serverAddress}/ws?clientId=${clientId}`);

      // ComfyUI workflow for generating post images
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
              Generate a social media post image for ${user.firstName} ${user.lastName}, who is a ${user.occupation}.
              Their interests include ${user.interests.join(", ")}.
              The post content: "${postText}".
              Use a futuristic, creative style that matches their personality: ${user.personality.type}.
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
            "filename_prefix": `${userId}_PostImage`,
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
                    const outputPath = path.join(outputDir, `${userId}_PostImage.png`);
                    fs.writeFileSync(outputPath, imageData.data);

                    const { PUBLIC_BASE_URL } = require('../config/env');
                    const base = PUBLIC_BASE_URL.replace(/\/$/, '');
                    const publicUrl = `${base}/profile-images/${userId}/${userId}_PostImage.png`;
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
      console.error('Error generating post image:', error.message);
      reject(error);
    }
  });
};

module.exports = { generatePostImage };
