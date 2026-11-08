import { calcularEdadMeses, AlertaBiologica } from './bovinos';

export type PropositoPorcino = 'carne' | 'reproduccion' | 'doble_proposito';

export const PROPOSITOS_PORCINO = [
  { value: 'carne', label: 'Producción de Carne (Engorde / Cebo)' },
  { value: 'reproduccion', label: 'Reproducción y Cría (Pie de Cría)' },
  { value: 'doble_proposito', label: 'Doble Propósito (Carne y Cría)' },
] as const;

export const RAZAS_POR_PROPOSITO_PORCINO: Record<PropositoPorcino, string[]> = {
  carne: [
    'Pietrain',
    'Duroc',
    'Hampshire',
    'Landrace',
    'Large White (Yorkshire)',
    'Criollo / Mestizo',
  ],
  reproduccion: [
    'Landrace',
    'Large White (Yorkshire)',
    'Duroc',
    'Criollo / Mestizo',
  ],
  doble_proposito: [
    'Duroc',
    'Landrace',
    'Large White (Yorkshire)',
    'Hampshire',
    'Criollo / Mestizo',
  ],
};

export const TODAS_LAS_RAZAS_PORCINAS: string[] = [
  'Pietrain',
  'Duroc',
  'Hampshire',
  'Landrace',
  'Large White (Yorkshire)',
  'Criollo / Mestizo',
];

export type EtapaPorcina =
  | 'Lechón lactante'
  | 'Lechón destetado / Recría'
  | 'Crecimiento y engorde'
  | 'Adulto / Reproductor';

/**
 * Obtiene la etapa fisiológica del porcino según su edad en meses
 */
export function obtenerEtapaPorcina(edadMeses: number): EtapaPorcina {
  if (edadMeses <= 1) return 'Lechón lactante';
  if (edadMeses <= 3) return 'Lechón destetado / Recría';
  if (edadMeses <= 6) return 'Crecimiento y engorde';
  return 'Adulto / Reproductor';
}

/**
 * Validaciones biológicas para Porcinos (Edad vs. Peso)
 * Rangos zootécnicos orientativos en producción porcina:
 * - 0 a 1 mes (Lechón lactante): 1.2 a 10 kg. (Alerta crítica si < 1.0 kg o > 15 kg)
 * - 2 a 3 meses (Lechón destetado / Recría): 15 a 50 kg. (Alerta crítica si < 12 kg o > 65 kg)
 * - 4 a 6 meses (Crecimiento y engorde / Cebo): 45 a 130 kg. (Alerta si < 40 kg o > 160 kg)
 * - > 6 meses (Adulto / Reproductor): 120 a 350+ kg. (Alerta bajo peso si < 90 kg o > 420 kg)
 */
export function validarPesoEdadPorcino(
  fechaNacimiento: string,
  peso: number | null | undefined
): { edadMeses: number | null; etapa: string; alertas: AlertaBiologica[] } {
  const alertas: AlertaBiologica[] = [];
  if (peso === undefined || peso === null || isNaN(peso) || peso <= 0) {
    return { edadMeses: null, etapa: '', alertas };
  }

  const edadMeses = calcularEdadMeses(fechaNacimiento);
  if (edadMeses === null) return { edadMeses: null, etapa: '', alertas };

  const etapa = obtenerEtapaPorcina(edadMeses);

  // 0 a 1 mes: Lechón lactante (nacimiento a destete)
  if (edadMeses <= 1) {
    if (peso < 1.0) {
      alertas.push({
        tipo: 'critica',
        mensaje: `Alerta biológica: Para un lechón lactante (0-1 mes), el peso ingresado (${peso} kg) está por debajo del mínimo crítico (< 1.0 kg). Rango esperado: 1.2 - 10 kg.`,
      });
    } else if (peso < 1.2) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Advertencia de desarrollo: El peso (${peso} kg) está ligeramente por debajo del promedio esperado (1.2 - 10 kg) para un lechón lactante.`,
      });
    } else if (peso > 15) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Advertencia de digitación: El peso (${peso} kg) supera el rango esperado para un lechón lactante (0-1 mes, máx. ~10-15 kg).`,
      });
    }
  }
  // 2 a 3 meses: Lechón destetado / Recría
  else if (edadMeses >= 2 && edadMeses <= 3) {
    if (peso < 12) {
      alertas.push({
        tipo: 'critica',
        mensaje: `Alerta de desnutrición / desarrollo: Peso crítico (${peso} kg < 12 kg) para lechón en etapa de recría (${edadMeses} meses). Rango esperado: 15 - 50 kg.`,
      });
    } else if (peso < 15) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Advertencia de crecimiento: El peso (${peso} kg) está por debajo del rango esperado (15 - 50 kg) para lechones destetados de 2 a 3 meses.`,
      });
    } else if (peso > 65) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Advertencia de digitación: El peso (${peso} kg) supera el promedio esperado (15 - 50 kg) para un lechón de ${edadMeses} meses.`,
      });
    }
  }
  // 4 a 6 meses: Crecimiento y engorde (cebo terminal)
  else if (edadMeses >= 4 && edadMeses <= 6) {
    if (peso < 40) {
      alertas.push({
        tipo: 'critica',
        mensaje: `Alerta de retraso en engorde: Peso insuficiente (${peso} kg < 40 kg) para un cerdo en etapa de crecimiento/cebo (${edadMeses} meses). Rango esperado: 45 - 130 kg.`,
      });
    } else if (peso < 45) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Advertencia de engorde: El peso (${peso} kg) está por debajo de la meta de desarrollo (45 - 130 kg) para cerdos de 4 a 6 meses.`,
      });
    } else if (peso > 160) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Advertencia de peso elevado: El peso (${peso} kg) excede el estándar de salida a mercado para cerdos de engorde de ${edadMeses} meses.`,
      });
    }
  }
  // > 6 meses: Cerdo adulto / Reproductor
  else if (edadMeses > 6) {
    if (peso < 90) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Alerta de peso bajo: Para un porcino adulto o reproductor (> 6 meses, edad: ${edadMeses} meses), el peso (${peso} kg) es bajo (esperado: 120 - 350+ kg).`,
      });
    } else if (peso > 420) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Advertencia de digitación: El peso (${peso} kg) es inusualmente alto incluso para un reproductor porcino adulto (> 420 kg).`,
      });
    }
  }

  return { edadMeses, etapa, alertas };
}
