import api from '@/lib/axios';

export interface Registro {
  id: number;
  tipo:
    | 'cultivo'
    | 'ganado'
    | 'mantenimiento'
    | 'produccion'
    | 'venta'
    | 'leche'
    | 'lote'
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
  loteId?: number;
  registradoPorId: number;
  registradoPor?: any;
  cultivo?: any;
  ganado?: any;
  lote?: {
    id: number;
    nombre: string;
    tipo: 'agricultura' | 'ganaderia';
  };
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
  getAll: async (area?: string, operativos?: boolean) => {
    const params: any = {};
    if (area) params.area = area;
    if (operativos === false) params.operativos = 'false';
    const response = await api.get('/registros', { params });
    return response.data;
  },

  getBitacora: async (area?: string) => {
    const response = await api.get('/registros', {
      params: {
        ...(area ? { area } : {}),
        operativos: 'false',
      },
    });
    return response.data;
  },

  getResumenFinanciero: async (area?: string) => {
    const response = await api.get('/registros/resumen-financiero', {
      params: area ? { area } : {},
    });
    return response.data;
  },

  getDashboardStats: async (area?: string) => {
    const response = await api.get('/registros/dashboard-stats', {
      params: area ? { area } : {},
    });
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
