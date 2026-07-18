import axios from 'axios';
import { authClient } from './auth';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Interceptor to attach the Neon Auth session token to the Authorization header
api.interceptors.request.use(async (config) => {
  try {
    const session = await authClient.getSession();
    const token = session.data?.session?.token;
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
      // Handle globally if needed
    }
    return Promise.reject(error);
  }
);

export default api;
