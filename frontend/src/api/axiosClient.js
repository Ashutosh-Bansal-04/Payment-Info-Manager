import axios from 'axios';

/**
 * Pre-configured axios instance.
 *
 * - baseURL is read from the VITE_API_BASE_URL env variable so it can differ
 *   between dev (http://localhost:5000/api) and production.
 * - A request interceptor automatically attaches the JWT from localStorage
 *   to every outgoing request's Authorization header (Bearer scheme).
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ---- Request interceptor: attach JWT if present ----
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor: handle 401 globally ----
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend returns 401 (token expired/invalid), clear stored auth
    // and redirect to login so the user can re-authenticate.
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
