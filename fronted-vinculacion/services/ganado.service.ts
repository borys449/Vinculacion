import api from '@/lib/axios';

export interface Ganado {
  id: number;
  identificacion: string;
  tipo: 'bovino' | 'porcino' | 'ovino' | 'caprino' | 'avicola' | 'otro';
  raza?: string | null;
  proposito?: 'leche' | 'carne' | 'doble_proposito' | null;
  produccionEstimadaDiaria?: number | null;
  fechaNacimiento: string;
  sexo: 'macho' | 'hembra';
  pesoInicial?: number | null;
  pesoActual?: number | null;
  estadoSalud: 'excelente' | 'bueno' | 'regular' | 'enfermo';
  estado: 'activo' | 'inactivo' | 'vendido' | 'enfermo' | 'gestacion' | 'fallecido';
  observaciones?: string | null;
  responsableId: number;
  responsable?: any;
  activo: boolean;
  fechaRegistro: string;
  produccionLechera?: ProduccionLecheraStats;
  evaluacionBiologica?: {
    edadMeses: number | null;
    advertencias: string[];
  };
}

export interface ProduccionLecheraStats {
  ganadoId: number;
  identificacion: string;
  raza?: string;
  proposito?: string;
  produccionEstimadaDiaria: number;
  produccionMensualEstimada: number;
  tieneRegistros: boolean;
  esEstimado: boolean;
  diasConRegistro: number;
  produccionHoy: number;
  promedioDiarioReal: number;
  totalMensualReal: number;
  promedioDiarioCalculado: number;
  totalMensualCalculado: number;
  proyeccionMensual: number;
  registrosMes?: any[];
}

export interface ResumenControlLechero {
  produccionHoy: number;
  promedioDiario: number;
  totalMes: number;
  totalBovinos: number;
  bovinosConRegistros: number;
  ultimosRegistros: any[];
  detallesPorAnimal: ProduccionLecheraStats[];
}

export type GanadoFormData = Omit<
  Ganado,
  'id' | 'responsableId' | 'responsable' | 'fechaRegistro' | 'produccionLechera' | 'evaluacionBiologica'
>;

export const ganadoService = {
  getAll: async (params?: { search?: string; estado?: string; tipo?: string; proposito?: string }) => {
    const response = await api.get('/ganado', { params });
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

  getControlLechero: async (id: number) => {
    const response = await api.get(`/ganado/${id}/control-lechero`);
    return response.data;
  },

  getResumenControlLechero: async () => {
    const response = await api.get('/ganado/control-lechero/resumen');
    return response.data;
  },

  registrarOrdenio: async (
    id: number,
    data: { cantidad: number; fecha?: string; sesion?: string; observaciones?: string }
  ) => {
    const response = await api.post(`/ganado/${id}/ordenio`, data);
    return response.data;
  },
};