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
  // 1. Login: Envía las credenciales. El backend responderá inyectando la cookie 'token'
  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    return response.data; // Retorna { success: true, data: usuario }
  },

  // 2. Registro: Procesa el flujo normal de creación de cuentas de la finca
  registro: async (data: RegistroData) => {
    const response = await api.post('/auth/registro', data);
    return response.data;
  },

  // 3. GetMe: Axios enviará la cookie automáticamente gracias a 'withCredentials: true'
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // 4. Logout: Informa al servidor para destruir la cookie y limpia el estado local visual
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error al notificar cierre de sesión al servidor:', error);
    } finally {
      // Limpiamos los datos de perfil visuales de la UI
      localStorage.removeItem('user');
    }
  },
};