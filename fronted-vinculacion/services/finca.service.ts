import api from '@/lib/axios';

export interface Lote {
  id: number;
  nombre: string;
  tipo: 'agricultura' | 'ganaderia';
  geometria: any;
  fincaId: number;
  creadoPorId: number;
  creadoPor?: {
    id: number;
    nombre: string;
    tipo: string;
    area: string;
  };
  cultivos?: Array<{
    id: number;
    nombre: string;
    tipo: string;
    area: number;
    unidad: string;
    estado: string;
  }>;
  ganado?: Array<{
    id: number;
    identificacion: string;
    tipo: string;
    raza?: string;
    especie?: string;
    proposito?: string;
  }>;
}

export interface Finca {
  id: number;
  nombre: string;
  poligonoPerimetro: any;
  propietarioId: number;
  lotes?: Lote[];
}

export const fincaService = {
  getMiFinca: async () => {
    const response = await api.get('/fincas/mi-finca');
    return response.data;
  },

  actualizarPerimetro: async (poligonoPerimetro: any, nombre?: string) => {
    const response = await api.put('/fincas/mi-finca/perimetro', { poligonoPerimetro, nombre });
    return response.data;
  },

  eliminarMapaCompleto: async () => {
    const response = await api.delete('/fincas/mi-finca/mapa');
    return response.data;
  },

  getLotes: async () => {
    const response = await api.get('/lotes');
    return response.data;
  },

  crearLote: async (data: { nombre: string; tipo: 'agricultura' | 'ganaderia'; geometria: any }) => {
    const response = await api.post('/lotes', data);
    return response.data;
  },

  actualizarLote: async (id: number, data: Partial<Lote>) => {
    const response = await api.put(`/lotes/${id}`, data);
    return response.data;
  },

  eliminarLote: async (id: number) => {
    const response = await api.delete(`/lotes/${id}`);
    return response.data;
  }
};
