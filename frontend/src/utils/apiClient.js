import axios from 'axios';
import API_BASE_URL from './config';
import { getValidToken, clearAuth } from './auth';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

client.interceptors.request.use((config) => {
  const token = getValidToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try { clearAuth(); } catch {}
    }
    return Promise.reject(err);
  }
);

export default client;

