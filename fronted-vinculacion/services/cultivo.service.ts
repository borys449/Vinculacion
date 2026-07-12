import api from '@/lib/axios';

export interface Cultivo {
  id: number;
  nombre: string;
  tipo: 'vegetal' | 'frutal' | 'cereal' | 'hortaliza' | 'leguminosa' | 'otro';
  area: number;
  unidad: 'metros' | 'hectareas';
  ubicacion: string;
  fechaSiembra: string;
  fechaCosechaEstimada?: string | null;
  estado: 'siembra' | 'crecimiento' | 'floracion' | 'cosecha' | 'completado';
  rendimiento?: number | null;
  observaciones?: string | null;
  responsableId: number;
  responsable?: any;
  fechaRegistro: string;
}

export type CultivoFormData = Omit<
  Cultivo,
  'id' | 'responsableId' | 'responsable' | 'fechaRegistro'
>;

export const cultivoService = {
  getAll: async () => {
    const response = await api.get('/cultivos');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/cultivos/${id}`);
    return response.data;
  },

  create: async (data: CultivoFormData) => {
    const response = await api.post('/cultivos', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CultivoFormData>) => {
    const response = await api.put(`/cultivos/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/cultivos/${id}`);
    return response.data;
  },
};
