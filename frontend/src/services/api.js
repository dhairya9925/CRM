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

// ==========================================
// Companies API
// ==========================================
export async function getCompanies(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.industry) query.append('industry', params.industry);
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return await request(`/v1/companies/${qStr}`);
}

export async function getCompany(id) {
  return await request(`/v1/companies/${id}`);
}

export async function createCompany(data) {
  return await request('/v1/companies/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCompany(id, data) {
  return await request(`/v1/companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCompany(id) {
  return await request(`/v1/companies/${id}`, {
    method: 'DELETE',
  });
}

export async function getCompanyContacts(id) {
  return await request(`/v1/companies/${id}/contacts`);
}

export async function getCompanyDeals(id) {
  return await request(`/v1/companies/${id}/deals`);
}

// ==========================================
// Contacts API
// ==========================================
export async function getContacts(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.company_id) query.append('company_id', params.company_id);
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return await request(`/v1/contacts/${qStr}`);
}

export async function getContact(id) {
  return await request(`/v1/contacts/${id}`);
}

export async function createContact(data) {
  return await request('/v1/contacts/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContact(id, data) {
  return await request(`/v1/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteContact(id) {
  return await request(`/v1/contacts/${id}`, {
    method: 'DELETE',
  });
}

export async function getContactDeals(id) {
  return await request(`/v1/contacts/${id}/deals`);
}

export async function getContactActivities(id) {
  return await request(`/v1/contacts/${id}/activities`);
}

// ==========================================
// Leads API
// ==========================================
export async function getLeads(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.source) query.append('source', params.source);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return await request(`/v1/leads/${qStr}`);
}

export async function getLead(id) {
  return await request(`/v1/leads/${id}`);
}

export async function createLead(data) {
  return await request('/v1/leads/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLead(id, data) {
  return await request(`/v1/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteLead(id) {
  return await request(`/v1/leads/${id}`, {
    method: 'DELETE',
  });
}

export async function assignLead(id, userId) {
  return await request(`/v1/leads/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assigned_to: userId }),
  });
}

export async function convertLead(id, convertData) {
  return await request(`/v1/leads/${id}/convert`, {
    method: 'POST',
    body: JSON.stringify(convertData),
  });
}

export async function getLeadActivities(id) {
  return await request(`/v1/leads/${id}/activities`);
}

// ==========================================
// Deals & Sales Pipeline API
// ==========================================
export async function getDeals(params = {}) {
  const query = new URLSearchParams();
  if (params.kanban) query.append('kanban', 'true');
  if (params.search) query.append('search', params.search);
  if (params.stage) query.append('stage', params.stage);
  if (params.owner_id) query.append('owner_id', params.owner_id);
  if (params.company_id) query.append('company_id', params.company_id);
  if (params.contact_id) query.append('contact_id', params.contact_id);
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return await request(`/v1/deals/${qStr}`);
}

export async function getDeal(id) {
  return await request(`/v1/deals/${id}`);
}

export async function createDeal(data) {
  return await request('/v1/deals/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDeal(id, data) {
  return await request(`/v1/deals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteDeal(id) {
  return await request(`/v1/deals/${id}`, {
    method: 'DELETE',
  });
}

export async function updateDealStage(id, stage) {
  return await request(`/v1/deals/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage }),
  });
}

export async function getDealActivities(id) {
  return await request(`/v1/deals/${id}/activities`);
}

// ==========================================
// Users API
// ==========================================
export async function getUsers() {
  try {
    return await request('/v1/users/?limit=100');
  } catch {
    return [];
  }
}

// ==========================================
// Tasks & Reminders API (Phase 4)
// ==========================================
export async function getTasks(params = {}) {
  const query = new URLSearchParams();
  if (params.assigned_to) query.append('assigned_to', params.assigned_to);
  if (params.status) query.append('status', params.status);
  if (params.lead_id) query.append('lead_id', params.lead_id);
  if (params.contact_id) query.append('contact_id', params.contact_id);
  if (params.deal_id) query.append('deal_id', params.deal_id);
  if (params.due_today) query.append('due_today', 'true');
  if (params.overdue) query.append('overdue', 'true');
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return await request(`/v1/tasks/${qStr}`);
}

export async function getTask(id) {
  return await request(`/v1/tasks/${id}`);
}

export async function createTask(data) {
  return await request('/v1/tasks/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(id, data) {
  return await request(`/v1/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function completeTask(id) {
  return await request(`/v1/tasks/${id}/complete`, {
    method: 'PATCH',
  });
}

export async function deleteTask(id) {
  return await request(`/v1/tasks/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// Activities Timeline API (Phase 5)
// ==========================================
export async function getActivities(params = {}) {
  const query = new URLSearchParams();
  if (params.lead_id) query.append('lead_id', params.lead_id);
  if (params.contact_id) query.append('contact_id', params.contact_id);
  if (params.deal_id) query.append('deal_id', params.deal_id);
  if (params.type) query.append('type', params.type);
  if (params.limit) query.append('limit', params.limit);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return await request(`/v1/activities/${qStr}`);
}

export async function getActivity(id) {
  return await request(`/v1/activities/${id}`);
}

export async function createActivity(data) {
  return await request('/v1/activities/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateActivity(id, data) {
  return await request(`/v1/activities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteActivity(id) {
  return await request(`/v1/activities/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// Dashboard & Reports API (Phase 6)
// ==========================================
export async function getDashboardSummary() {
  return await request('/v1/dashboard/summary');
}

export async function getDashboardLeadsByStatus() {
  return await request('/v1/dashboard/leads-by-status');
}

export async function getDashboardLeadsBySource() {
  return await request('/v1/dashboard/leads-by-source');
}

export async function getDashboardPipeline() {
  return await request('/v1/dashboard/pipeline');
}

export async function getTasksDueToday() {
  return await request('/v1/dashboard/tasks-due-today');
}

export async function getTasksOverdue() {
  return await request('/v1/dashboard/tasks-overdue');
}

