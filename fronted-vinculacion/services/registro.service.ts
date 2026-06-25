import api from '@/lib/axios';

export interface Registro {
  id: number;
  tipo:
    | 'cultivo'
    | 'ganado'
    | 'mantenimiento'
    | 'produccion'
    | 'venta'
    | 'otro';
  categoria: string;
  descripcion: string;
  fecha: string;
  cantidad?: number;
  unidad?:
    | 'kg'
    | 'toneladas'
    | 'litros'
    | 'unidades'
    | 'metros'
    | 'hectareas'
    | 'otro';
  costo?: number;
  ingresos?: number;
  observaciones?: string;
  cultivoId?: number;
  ganadoId?: number;
  registradoPorId: number;
  registradoPor?: any;
  cultivo?: any;
  ganado?: any;
  fechaRegistro: string;
}

export type RegistroFormData = Omit<
  Registro,
  | 'id'
  | 'registradoPorId'
  | 'registradoPor'
  | 'cultivo'
  | 'ganado'
  | 'fechaRegistro'
>;

export const registroService = {
  getAll: async () => {
    const response = await api.get('/registros');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/registros/${id}`);
    return response.data;
  },

  create: async (data: RegistroFormData) => {
    const response = await api.post('/registros', data);
    return response.data;
  },

  update: async (id: number, data: Partial<RegistroFormData>) => {
    const response = await api.put(`/registros/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/registros/${id}`);
    return response.data;
  },
};
