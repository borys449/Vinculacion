import api from '@/lib/axios';
import { Usuario } from './auth.service';

export const usuarioService = {
  getAll: async () => {
    const response = await api.get('/usuarios');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  update: async (id: number, data: Partial<Usuario>) => {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  },

  changePassword: async (id: number, newPassword: string) => {
    const response = await api.put(`/usuarios/${id}/password`, { newPassword });
    return response.data;
  },
};
