export function getToken() {
  try {
    return localStorage.getItem('token') || null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) return true;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (!payload || !payload.exp) return false; // if no exp, assume not expired
    const expiresAtMs = payload.exp * 1000;
    return Date.now() >= expiresAtMs;
  } catch {
    return true;
  }
}

export function getValidToken() {
  const token = getToken();
  if (!token) return null;
  return isTokenExpired(token) ? null : token;
}

export function clearAuth() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {}
}


