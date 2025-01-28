const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const serverAddress = "127.0.0.1:8188";
const mongoURI = "mongodb://localhost:27017"; // Update if using MongoDB Atlas
const dbName = "AIverse";
const collectionName = "users";

/**
 * Generate a profile picture for an AI user using ComfyUI and store the image path in MongoDB.
 * @param {Object} user - The AI user details.
 * @returns {Promise<string>} - The public URL of the generated image.
 */
const generateProfilePicture = async (user) => {
  return new Promise((resolve, reject) => {
    try {
      const clientId = require('crypto').randomUUID(); // Generate unique client ID
      const userId = user._id ? user._id.toString() : `${user.firstName}_${user.lastName}`;
      const ws = new WebSocket(`ws://${serverAddress}/ws?clientId=${clientId}`);

      // Embedded workflow JSON
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
            `,
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
          "inputs": {
            "filename_prefix": `${userId}_PFP`,
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
              ws.close(); // Close WebSocket connection after execution

              // Fetch history to get image outputs
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

                    // Save image to /outputs/{userId}/{userId}_PFP.png
                    const outputDir = path.join(__dirname, '../outputs', userId);
                    if (!fs.existsSync(outputDir)) {
                      fs.mkdirSync(outputDir, { recursive: true });
                    }
                    const outputPath = path.join(outputDir, `${userId}_PFP.png`);
                    fs.writeFileSync(outputPath, imageData.data);
                    console.log('Image saved to:', outputPath);

                    // Convert local path to a public URL
                    const publicUrl = `http://localhost:5000/profile-images/${userId}/${userId}_PFP.png`;

                    // Save URL to MongoDB
                    await saveProfileImageToMongoDB(user._id, publicUrl);

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
      console.error('Error generating profile picture:', error.message);
      reject(error);
    }
  });
};

/**
 * Save the profile image URL to MongoDB.
 * @param {string} userId - The user's MongoDB ID.
 * @param {string} imageUrl - The public URL of the generated image.
 */
const saveProfileImageToMongoDB = async (userId, imageUrl) => {
  const client = new MongoClient(mongoURI);
  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection(collectionName);

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { profileImage: imageUrl } }
    );

    console.log(`✅ Updated profile image for user ${userId}: ${imageUrl}`);
  } catch (error) {
    console.error("❌ Error updating profile image in MongoDB:", error.message);
  } finally {
    await client.close();
  }
};

module.exports = { generateProfilePicture };
