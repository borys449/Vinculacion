import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  withCredentials: true, // 👈 ¡CRÍTICO! Permite al navegador recibir, guardar y enviar las cookies automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

// 💡 EL INTERCEPTOR DE REQUEST YA NO CONTIENE LOCALSTORAGE.
// Al activar 'withCredentials: true', Axios adjunta la cookie HttpOnly en el fondo de forma nativa.
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores (como la expiración de sesión)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 🔒 Si el servidor responde 401 (No autorizado / Token vencido):
      // Limpiamos únicamente datos visuales no sensibles que mantengan en local
      localStorage.removeItem('user');
      
      // Redirigimos al inicio de sesión de inmediato
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;