import api from '@/lib/axios';

export interface Ganado {
  id: number;
  identificacion: string;
  tipo: 'bovino' | 'porcino' | 'ovino' | 'caprino' | 'avicola' | 'otro';
  raza: string;
  fechaNacimiento: string;
  sexo: 'macho' | 'hembra';
  pesoInicial?: number | null;
  pesoActual?: number | null;
  estadoSalud: 'excelente' | 'bueno' | 'regular' | 'enfermo';
  observaciones?: string | null;
  responsableId: number;
  responsable?: any;
  activo: boolean;
  fechaRegistro: string;
}

export type GanadoFormData = Omit<
  Ganado,
  'id' | 'responsableId' | 'responsable' | 'fechaRegistro'
>;

export const ganadoService = {
  getAll: async () => {
    const response = await api.get('/ganado');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/ganado/${id}`);
    return response.data;
  },

  create: async (data: GanadoFormData) => {
    const response = await api.post('/ganado', data);
    return response.data;
  },

  update: async (id: number, data: Partial<GanadoFormData>) => {
    const response = await api.put(`/ganado/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/ganado/${id}`);
    return response.data;
  },
};
