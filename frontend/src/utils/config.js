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

let chosen = (resolvedFromEnv && resolvedFromEnv.trim())
  || (resolvedFromMeta && resolvedFromMeta.trim())
  || (resolvedFromWindow && String(resolvedFromWindow).trim())
  || (import.meta.env && import.meta.env.PROD ? defaultProductionUrl : defaultLocalUrl);

// Normalize and harden against accidental frontend origin usage
if (typeof window !== 'undefined') {
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  const isHostedFrontend = /vercel\.app$|netlify\.app$|github\.io$/.test(hostname);
  const isEmpty = !chosen || !/^https?:\/\//i.test(chosen);
  const accidentallyFrontend = chosen === origin || chosen.includes(hostname);
  const isProd = !!(import.meta.env && import.meta.env.PROD);
  if (isProd && (isEmpty || accidentallyFrontend)) {
    chosen = defaultProductionUrl;
  }
}

const API_BASE_URL = chosen.replace(/\/$/, '');

if (typeof window !== 'undefined') {
  // Console diagnostics to verify which value is being used at runtime
  // These logs are intentional for debugging deployment issues
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
