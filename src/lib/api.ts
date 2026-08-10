import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5259';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const status = error.response?.status;

    if (status === 401) {
      // Clear credentials and send to login
      localStorage.removeItem('pms_token');
      localStorage.removeItem('pms_user');
      localStorage.removeItem('pms_subscription');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (status === 402) {
      // Subscription expired — block navigation and send to the expired page
      // We do NOT clear the token; the user should still be able to reach /subscription pages
      window.location.href = '/subscription/expired';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
