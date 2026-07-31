// src/services/api.js
// Central API client module.
// Automatically attaches the Bearer token to all requests from a single place.

const BASE_URL = import.meta.env.VITE_API_URL || '/api';


/**
 * Retrieve the token securely.
 * sessionStorage is chosen as a safer option than localStorage, as it is scoped
 * to the current tab and is wiped automatically when the tab is closed.
 */
export function getToken() {
  return sessionStorage.getItem('gvmc_fms_token');
}

export function setToken(token) {
  if (token) {
    sessionStorage.setItem('gvmc_fms_token', token);
  } else {
    sessionStorage.removeItem('gvmc_fms_token');
  }
}

export function getUser() {
  const userJson = sessionStorage.getItem('gvmc_fms_user');
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  if (user) {
    sessionStorage.setItem('gvmc_fms_user', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('gvmc_fms_user');
  }
}

export function logout() {
  setToken(null);
  setUser(null);
  window.location.href = '/login';
}

async function request(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // Session expired or invalid
    setToken(null);
    setUser(null);
    // Only redirect if we are not already on the login page or citizen page
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/status')) {
      window.location.href = '/login?expired=true';
    }
  }

  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
