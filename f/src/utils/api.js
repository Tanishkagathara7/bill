/**
 * api.js — Real HTTP client for the QuickBill Express backend.
 */

// ─── Base URL ────────────────────────────────────────────────────────────────
// Set REACT_APP_API_URL in f/.env for local dev.
// In production (Vercel) set it as an environment variable pointing to Render.
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Thin fetch wrapper that:
 *  1. Always sends/receives JSON
 *  2. Throws a proper Error with the server's message on non-2xx responses
 *  3. Includes credentials and JWT Authorization header
 */
async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit', // We are using JWT Bearer tokens now instead of cookies
  };
  
  // Attach JWT token from localStorage if it exists
  const token = localStorage.getItem('quickbill_jwt_token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);

  // Parse JSON regardless of status so we can read the error message
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // If the token is invalid or expired, log them out
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('quickbill_jwt_token');
      localStorage.removeItem('quickbill_user');
      // We could trigger a redirect to login here if we had access to history/navigate,
      // but the app components will naturally redirect if userManager.getCurrentUser() is null.
    }
    // Use the server's message field if present, otherwise fall back to HTTP status text
    throw new Error(data.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  return data;
}

/**
 * Normalise a MongoDB document so the rest of the frontend can use `id`
 * instead of `_id`. We keep `_id` too so nothing breaks if it's referenced.
 */
function normalise(doc) {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(normalise);
  return { ...doc, id: doc._id || doc.id };
}

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email, password) => {
    const data = await request('POST', '/api/auth/login', { email, password });
    return data;
  },
  
  register: async (userData) => {
    const data = await request('POST', '/api/auth/register', userData);
    return data;
  },
  
  getMe: async () => {
    const data = await request('GET', '/api/auth/me');
    return normalise(data.data);
  }
};

// ─── Products API ─────────────────────────────────────────────────────────────

export const productsApi = {
  getAll: async () => {
    const data = await request('GET', '/api/products');
    return normalise(data);
  },

  getById: async (id) => {
    const data = await request('GET', `/api/products/${id}`);
    return normalise(data);
  },

  create: async (productData) => {
    const data = await request('POST', '/api/products', productData);
    return normalise(data);
  },

  update: async (id, productData) => {
    const data = await request('PUT', `/api/products/${id}`, productData);
    return normalise(data);
  },

  delete: async (id) => {
    return await request('DELETE', `/api/products/${id}`);
  },
};

// ─── Bills API ────────────────────────────────────────────────────────────────

export const billsApi = {
  getAll: async () => {
    const data = await request('GET', '/api/bills');
    return normalise(data);
  },

  getById: async (id) => {
    const data = await request('GET', `/api/bills/${id}`);
    return normalise(data);
  },

  create: async (billData) => {
    // The backend generates its own billNumber — strip the frontend-generated
    // one so we don't collide, but keep it as a hint/fallback field.
    const { billNumber: _hint, ...rest } = billData;
    const data = await request('POST', '/api/bills', rest);
    return normalise(data);
  },

  update: async (id, billData) => {
    const data = await request('PUT', `/api/bills/${id}`, billData);
    return normalise(data);
  },

  delete: async (id) => {
    return await request('DELETE', `/api/bills/${id}`);
  },
};

// ─── Stats API ────────────────────────────────────────────────────────────────

export const statsApi = {
  get: async () => {
    return await request('GET', '/api/dashboard/stats');
  },
};
