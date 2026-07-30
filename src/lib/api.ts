import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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

// On 401 clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('pms_token');
      localStorage.removeItem('pms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
