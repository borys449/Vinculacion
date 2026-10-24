import axios from 'axios';

const api = axios.create({
  // Apunta directamente al puerto 8080 del backend Express en local
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
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