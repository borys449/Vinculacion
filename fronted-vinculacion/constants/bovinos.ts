export type PropositoBovino = 'leche' | 'carne' | 'doble_proposito';

export const PROPOSITOS_BOVINO = [
  { value: 'leche', label: 'Especializada en Leche' },
  { value: 'carne', label: 'Especializada en Carne' },
  { value: 'doble_proposito', label: 'Doble Propósito (Carne y Leche)' },
] as const;

export const RAZAS_POR_PROPOSITO: Record<PropositoBovino, string[]> = {
  leche: [
    'Holstein Friesian',
    'Girolando',
    'Criolla / Mestiza',
  ],
  carne: [
    'Brahman',
    'Angus',
    'Criolla / Mestiza',
  ],
  doble_proposito: [
    'Brown Swiss (Pardo Suizo)',
    'Simmental',
    'Criolla / Mestiza',
  ],
};

export const TODAS_LAS_RAZAS_BOVINAS: string[] = [
  'Holstein Friesian',
  'Girolando',
  'Brahman',
  'Angus',
  'Brown Swiss (Pardo Suizo)',
  'Simmental',
  'Criolla / Mestiza',
];

/**
 * Calcula la edad en meses entre la fecha de nacimiento y hoy
 */
export function calcularEdadMeses(fechaNacimiento: string): number | null {
  if (!fechaNacimiento) return null;
  const nacimiento = new Date(fechaNacimiento.replace(/-/g, '/'));
  if (isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let meses = (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + (hoy.getMonth() - nacimiento.getMonth());
  if (hoy.getDate() < nacimiento.getDate()) {
    meses--;
  }
  return Math.max(0, meses);
}

export interface AlertaBiologica {
  tipo: 'critica' | 'advertencia' | 'info';
  mensaje: string;
}

/**
 * Validaciones biológicas (Edad vs. Peso)
 */
export function validarPesoEdadBovino(
  fechaNacimiento: string,
  peso: number | null | undefined
): { edadMeses: number | null; alertas: AlertaBiologica[] } {
  const alertas: AlertaBiologica[] = [];
  if (peso === undefined || peso === null || isNaN(peso) || peso <= 0) {
    return { edadMeses: null, alertas };
  }

  const edadMeses = calcularEdadMeses(fechaNacimiento);
  if (edadMeses === null) return { edadMeses: null, alertas };

  // 0 a 1 mes (Recién nacido): Rango esperado: 25 - 50 kg. (Alerta si es < 20 kg o > 60 kg)
  if (edadMeses <= 1) {
    if (peso < 20) {
      alertas.push({
        tipo: 'critica',
        mensaje: `Alerta biológica: Para un recién nacido (0-1 mes), el peso ingresado (${peso} kg) está por debajo del mínimo crítico (esperado: 25 - 50 kg, alerta < 20 kg).`,
      });
    } else if (peso > 60) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Advertencia: Para un recién nacido (0-1 mes), el peso ingresado (${peso} kg) supera el rango esperado (25 - 50 kg, alerta > 60 kg).`,
      });
    }
  }
  // 2 a 6 meses (Ternero): Rango esperado: 60 - 180 kg. (Alerta de desnutrición si es < 50 kg a los 4 meses)
  else if (edadMeses >= 2 && edadMeses <= 6) {
    if (peso < 50) {
      alertas.push({
        tipo: 'critica',
        mensaje: `Alerta de desnutrición: Peso crítico (${peso} kg) inferior a 50 kg para ternero en etapa de crecimiento (${edadMeses} meses). Rango esperado: 60 - 180 kg.`,
      });
    } else if (peso < 60) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Advertencia de desarrollo: El peso (${peso} kg) está por debajo del rango esperado (60 - 180 kg) para terneros de 2 a 6 meses.`,
      });
    } else if (peso > 180) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Advertencia de digitación: El peso (${peso} kg) supera el rango esperado (60 - 180 kg) para un ternero de 2 a 6 meses.`,
      });
    }
  }
  // > 24 meses (Adulto): Rango esperado: 350 - 750+ kg.
  else if (edadMeses > 24) {
    if (peso < 350) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Alerta de peso bajo: Para un bovino adulto (> 24 meses), el peso (${peso} kg) es inferior al rango esperado (350 - 750+ kg).`,
      });
    }
  }

  return { edadMeses, alertas };
}
