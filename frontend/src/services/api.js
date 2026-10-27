// Apex CRM API Service Layer
// Communicates with FastAPI backend (/api/v1/...)

const API_BASE = '/api';

/**
 * Helper to get stored auth token
 */
export function getStoredToken() {
  return localStorage.getItem('apex_access_token');
}

/**
 * Helper to store tokens
 */
export function setStoredTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem('apex_access_token', accessToken);
  if (refreshToken) localStorage.setItem('apex_refresh_token', refreshToken);
}

/**
 * Helper to clear stored tokens
 */
export function clearStoredTokens() {
  localStorage.removeItem('apex_access_token');
  localStorage.removeItem('apex_refresh_token');
}

/**
 * Universal fetch wrapper with token injection and automatic 401 handling
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Include HttpOnly cookies
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new Error('Unable to connect to Apex CRM API server. Check your network or server status.');
  }

  // Handle Token Expiry & Automatic Refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const refreshToken = localStorage.getItem('apex_refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
          const tokenData = await refreshRes.json();
          setStoredTokens(tokenData.access_token, tokenData.refresh_token);
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${tokenData.access_token}`;
          return await fetch(url, { ...config, headers });
        }
      } catch {
        // Refresh failed, proceed to handle original 401
      }
    }
    clearStoredTokens();
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = data?.detail || data?.message || (typeof data === 'string' ? data : `Error ${response.status}`);
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// System Health
export async function checkBackendHealth() {
  try {
    const res = await request('/health');
    return {
      connected: res.status === 'ok' && res.db === 'connected',
      details: res,
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
    };
  }
}

// Auth API Calls
export async function apiLogin(email, password) {
  const data = await request('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setStoredTokens(data.access_token, data.refresh_token);
  return data;
}

export async function apiSignup(fullName, email, password) {
  const data = await request('/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
    }),
  });
  setStoredTokens(data.access_token, data.refresh_token);
  return data;
}

export async function apiGetCurrentUser() {
  return await request('/v1/auth/me', {
    method: 'GET',
  });
}

export async function apiLogout() {
  try {
    await request('/v1/auth/logout', {
      method: 'POST',
    });
  } catch {
    // Clean up locally even if network fails
  } finally {
    clearStoredTokens();
  }
}

export async function apiRequestPasswordReset(email) {
  return await request('/v1/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiConfirmPasswordReset(token, newPassword) {
  return await request('/v1/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({
      token,
      new_password: newPassword,
    }),
  });
}
