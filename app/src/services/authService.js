import { apiCall, API_ENDPOINTS } from '../config/api';
import logger from '../utils/logger';

const TOKEN_KEY = 'auth_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(username, password) {
  const response = await apiCall(API_ENDPOINTS.LOGIN, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const err = data.error || `Login failed (status: ${response.status})`;
    throw new Error(err);
  }

  const data = await response.json();
  if (data.token) {
    setToken(data.token);
  }
  return data.user;
}

export async function verify(timeout = 5000) {
  // Uses apiCall which performs timeout via AbortController
  const response = await apiCall(API_ENDPOINTS.VERIFY, { timeout });
  if (!response.ok) {
    throw new Error(`Verify failed (status: ${response.status})`);
  }
  const data = await response.json();
  return data.user;
}

export function logout() {
  clearToken();
}

export default { getToken, setToken, clearToken, login, verify, logout };
