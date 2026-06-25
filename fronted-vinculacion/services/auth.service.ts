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
  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  registro: async (data: RegistroData) => {
    const response = await api.post('/auth/registro', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
