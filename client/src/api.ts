import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Interceptor to attach the token to the Authorization header
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Failed to retrieve session token', err);
  }
  return config;
});

// Interceptor to handle unauthorized errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/me');
      if (isAuthRoute) {
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
