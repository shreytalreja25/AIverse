// Resolve API base URL with robust fallbacks and helpful diagnostics
// Note: Avoid using `typeof import` (invalid). Vite guarantees `import.meta` in ESM.

const resolvedFromEnv = (import.meta && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_PUBLIC_API_URL || import.meta.env.VITE_BACKEND_URL)) || '';
const resolvedFromMeta = (() => {
  if (typeof document === 'undefined') return '';
  const tag = document.querySelector('meta[name="backend-base-url"]');
  return tag?.getAttribute('content') || '';
})();
const resolvedFromWindow = typeof window !== 'undefined' ? (window.__VITE_API_URL || window.__API_BASE_URL || window.__BACKEND_URL) : '';

const defaultProductionUrl = 'https://aiverse-sbs6.onrender.com';
const defaultLocalUrl = 'http://localhost:5000';

// Determine if we're in production
const isProduction = import.meta.env && import.meta.env.PROD;
const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

let chosen = '';

// Priority order: Environment variables > Meta tags > Window variables > Defaults
if (resolvedFromEnv && resolvedFromEnv.trim()) {
  chosen = resolvedFromEnv.trim();
} else if (resolvedFromMeta && resolvedFromMeta.trim()) {
  chosen = resolvedFromMeta.trim();
} else if (resolvedFromWindow && String(resolvedFromWindow).trim()) {
  chosen = String(resolvedFromWindow).trim();
} else {
  // Use production URL for Vercel deployments, local for development
  chosen = (isProduction || isVercel) ? defaultProductionUrl : defaultLocalUrl;
}

// Safety checks to prevent using frontend URL as backend
if (typeof window !== 'undefined') {
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  
  // If chosen URL is the same as frontend origin, use production backend
  if (chosen === origin || chosen.includes(hostname)) {
    chosen = defaultProductionUrl;
  }
  
  // If no valid URL chosen, use appropriate default
  if (!chosen || !/^https?:\/\//i.test(chosen)) {
    chosen = (isProduction || isVercel) ? defaultProductionUrl : defaultLocalUrl;
  }
}

const API_BASE_URL = chosen.replace(/\/$/, '');

if (typeof window !== 'undefined') {
  // Console diagnostics to verify which value is being used at runtime
  // These logs are intentional for debugging deployment issues
  // eslint-disable-next-line no-console
  console.log('[config] Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
  // eslint-disable-next-line no-console
  console.log('[config] Hostname:', window.location.hostname);
  // eslint-disable-next-line no-console
  console.log('[config] import.meta.env.VITE_API_URL =', resolvedFromEnv || '(empty)');
  // eslint-disable-next-line no-console
  console.log('[config] meta[backend-base-url] =', resolvedFromMeta || '(empty)');
  // eslint-disable-next-line no-console
  console.log('[config] window.__VITE_API_URL =', resolvedFromWindow || '(empty)');
  // eslint-disable-next-line no-console
  console.log('[config] API_BASE_URL resolved to', API_BASE_URL);
}

export default API_BASE_URL;
