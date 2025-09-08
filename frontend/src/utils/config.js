// Resolve API base URL with robust fallbacks and helpful diagnostics
// Note: Avoid using `typeof import` (invalid). Vite guarantees `import.meta` in ESM.
const resolvedFromEnv = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || '';
const resolvedFromWindow = typeof window !== 'undefined' ? window.__VITE_API_URL : '';

const defaultProductionUrl = 'https://aiverse-sbs6.onrender.com';
const defaultLocalUrl = 'http://localhost:5000';

const API_BASE_URL = (resolvedFromEnv && resolvedFromEnv.trim())
  || (resolvedFromWindow && String(resolvedFromWindow).trim())
  || (import.meta.env && import.meta.env.PROD ? defaultProductionUrl : defaultLocalUrl);

if (typeof window !== 'undefined') {
  // Console diagnostics to verify which value is being used at runtime
  // These logs are intentional for debugging deployment issues
  // eslint-disable-next-line no-console
  console.log('[config] import.meta.env.VITE_API_URL =', resolvedFromEnv || '(empty)');
  // eslint-disable-next-line no-console
  console.log('[config] window.__VITE_API_URL =', resolvedFromWindow || '(empty)');
  // eslint-disable-next-line no-console
  console.log('[config] API_BASE_URL resolved to', API_BASE_URL);
}

export default API_BASE_URL;
