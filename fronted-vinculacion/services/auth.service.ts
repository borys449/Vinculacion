import api from '@/lib/axios';

export interface LoginData {
  user: string;
  password: string;
}

export interface RegistroData {
  nombre: string;
  cedula: string;
  email: string;
  telefono: string;
  area:
    | 'cultivos'
    | 'ganaderia'
    | 'mantenimiento'
    | 'administracion'
    | 'investigacion';
  tipo: 'trabajador' | 'administrador';
  password: string;
  confirmPassword: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  cedula: string;
  email: string;
  telefono: string;
  area: string;
  tipo: string;
  activo: boolean;
  fechaRegistro: string;
}

export const authService = {
  // 1. Login: El backend ahora responderá inyectando la cookie 'token' directamente en el navegador.
  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    return response.data; // Retorna la info del usuario (nombre, rol) si es necesario, pero ya no maneja tokens aquí.
  },

  // 2. Registro: Sigue procesando el flujo normal de creación de cuentas de la finca.
  registro: async (data: RegistroData) => {
    const response = await api.post('/auth/registro', data);
    return response.data;
  },

  // 3. GetMe: Gracias a 'withCredentials: true', Axios enviará la cookie automáticamente 
  // para que el backend valide la sesión en el servidor.
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // 4. Logout: Cambia a asíncrono. Despacha una petición al backend para borrar la cookie HttpOnly
  // y limpia los datos visuales que no sean sensibles del estado local.
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error al notificar cierre de sesión al servidor:', error);
    } finally {
      // Limpiamos los datos visuales/perfil de la UI si existían, pero el token ya está destruido en las cookies.
      localStorage.removeItem('user');
    }
  },
};