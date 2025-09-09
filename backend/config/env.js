// Centralized environment configuration with sensible fallbacks
require('dotenv').config();

const toBool = (v, def = false) => {
  if (v === undefined) return def;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
};

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production' || toBool(process.env.PROD, false);

// API base URL (used for server-to-server calls in controllers)
// In production prefer BASE_API_URL_PROD if provided
const BASE_API_URL_PROD = process.env.BASE_API_URL_PROD || '';
const API_BASE_URL = IS_PROD && BASE_API_URL_PROD
  ? BASE_API_URL_PROD
  : (
    process.env.API_BASE_URL ||
    process.env.BACKEND_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${process.env.PORT || 5000}`
  );

// Public base URL for generating absolute asset links
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || API_BASE_URL;

// Ollama/DeepSeek local server
const OLLAMA_URL = process.env.OLLAMA_URL || process.env.DEEPSEEK_OLLAMA_URL || 'http://127.0.0.1:11434';

// ComfyUI host/port
const COMFYUI_HOST = process.env.COMFYUI_HOST || '127.0.0.1';
const COMFYUI_PORT = parseInt(process.env.COMFYUI_PORT || '8188', 10);

// AI provider keys
// Support common alias env var names used by various hosts/providers
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GENERATIVE_LANGUAGE_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY || '';
// Use a widely available model as default; can be overridden via env
const HF_TXT2IMG_MODEL = process.env.HF_TXT2IMG_MODEL || 'runwayml/stable-diffusion-v1-5';

// Database
const USE_ATLAS = toBool(process.env.USE_ATLAS, false);
const MONGO_URI_ATLAS = process.env.MONGO_URI_ATLAS || '';
const MONGO_URI_LOCAL = process.env.MONGO_URI_LOCAL || 'mongodb://localhost:27017/AIverse';

// Auth
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

module.exports = {
  NODE_ENV,
  IS_PROD,
  API_BASE_URL,
  PUBLIC_BASE_URL,
  BASE_API_URL_PROD,
  OLLAMA_URL,
  COMFYUI_HOST,
  COMFYUI_PORT,
  GEMINI_API_KEY,
  OPENAI_API_KEY,
  HUGGINGFACE_API_KEY,
  HF_TXT2IMG_MODEL,
  USE_ATLAS,
  MONGO_URI_ATLAS,
  MONGO_URI_LOCAL,
  JWT_SECRET,
};


