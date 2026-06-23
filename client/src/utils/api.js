import axios from 'axios';
console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);
const api = axios.create({
  baseURL: 'https://code-corrector-ai.vercel.app/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send httpOnly refresh cookie
});

// Attach JWT access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Silent refresh interceptor ───────────────────────────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else        prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      // Don't retry the refresh call itself — avoid infinite loop
      if (originalRequest.url?.includes('/auth/refresh') ||
          originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(err);
      }

      if (isRefreshing) {
        // Queue subsequent 401s while the first refresh is in-flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((e) => Promise.reject(e));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.token;
        localStorage.setItem('cc_token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Refresh failed — force logout
        localStorage.removeItem('cc_token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
