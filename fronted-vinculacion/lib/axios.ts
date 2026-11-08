import axios from 'axios';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  const hostname = typeof window === 'undefined' ? 'localhost' : window.location.hostname;
  return `http://${hostname}:8080/api`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // 🔒 Crucial para recibir y enviar las cookies HttpOnly
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores globales (como el rebotar al login si da 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;