import { AlertaBiologica, calcularEdadMeses } from './bovinos';

export const ESPECIES_OVIPARAS = [
  { value: 'gallina', label: 'Gallina' },
  { value: 'pato', label: 'Pato' },
  { value: 'pavo', label: 'Pavo' },
  { value: 'codorniz', label: 'Codorniz' },
  { value: 'ganso', label: 'Ganso' },
] as const;

export type EspecieOvipara = (typeof ESPECIES_OVIPARAS)[number]['value'];
export type PropositoOviparo = 'huevos' | 'carne' | 'doble_proposito' | 'reproduccion';

export const PROPOSITOS_POR_ESPECIE: Record<
  EspecieOvipara,
  { value: PropositoOviparo; label: string }[]
> = {
  gallina: [
    { value: 'huevos', label: 'Producción de huevos' },
    { value: 'carne', label: 'Producción de carne' },
    { value: 'doble_proposito', label: 'Doble propósito' },
    { value: 'reproduccion', label: 'Reproducción' },
  ],
  pato: [
    { value: 'carne', label: 'Producción de carne' },
    { value: 'huevos', label: 'Producción de huevos' },
    { value: 'doble_proposito', label: 'Doble propósito' },
  ],
  pavo: [
    { value: 'carne', label: 'Producción de carne' },
    { value: 'reproduccion', label: 'Reproducción' },
  ],
  codorniz: [
    { value: 'huevos', label: 'Producción de huevos' },
    { value: 'carne', label: 'Producción de carne' },
    { value: 'reproduccion', label: 'Reproducción' },
  ],
  ganso: [
    { value: 'carne', label: 'Producción de carne' },
    { value: 'huevos', label: 'Producción de huevos' },
    { value: 'doble_proposito', label: 'Doble propósito' },
  ],
};

const CRIOLLA = 'Criollo / Mestizo';

export const RAZAS_POR_ESPECIE_Y_PROPOSITO: Record<
  EspecieOvipara,
  Partial<Record<PropositoOviparo, string[]>>
> = {
  gallina: {
    huevos: ['Leghorn', 'Lohmann Brown', 'Hy-Line Brown', 'Isa Brown', 'Rhode Island Red', CRIOLLA],
    carne: ['Broiler (Ross 308)', 'Cobb 500', 'Cornish', CRIOLLA],
    doble_proposito: ['Rhode Island Red', 'Plymouth Rock', 'Sussex', 'New Hampshire', CRIOLLA],
    reproduccion: [
      'Rhode Island Red',
      'Plymouth Rock',
      'Sussex',
      'Líneas reproductoras comerciales',
      CRIOLLA,
    ],
  },
  pato: {
    carne: ['Pekín', 'Muscovy (criollo)', 'Rouen', CRIOLLA],
    huevos: ['Khaki Campbell', 'Indian Runner', 'Welsh Harlequin', CRIOLLA],
    doble_proposito: ['Muscovy', 'Rouen', CRIOLLA],
  },
  pavo: {
    carne: ['Broad Breasted White', 'Broad Breasted Bronze', 'Bourbon Red', CRIOLLA],
    reproduccion: ['Bourbon Red', 'Narragansett', 'Bronze', CRIOLLA],
  },
  codorniz: {
    huevos: ['Coturnix japonesa', 'Manchurian Golden', CRIOLLA],
    carne: ['Coturnix japonesa', 'Bobwhite', CRIOLLA],
    reproduccion: ['Coturnix japonesa', 'Bobwhite', CRIOLLA],
  },
  ganso: {
    carne: ['Toulouse', 'Embden', 'African Goose', CRIOLLA],
    huevos: ['Chinese Goose', 'Embden', CRIOLLA],
    doble_proposito: ['Toulouse', 'Embden', CRIOLLA],
  },
};

export const EDAD_INICIO_POSTURA_MESES: Record<EspecieOvipara, number> = {
  gallina: 5,
  pato: 6,
  pavo: 7,
  codorniz: 2,
  ganso: 9,
};

const PARAMETROS_BIOLOGICOS: Record<
  EspecieOvipara,
  {
    pollueloHastaMeses: number;
    crecimientoHastaMeses: number;
    polluelo: [number, number];
    crecimientoHembra: [number, number];
    crecimientoMacho: [number, number];
    adultoHembra: [number, number];
    adultoMacho: [number, number];
  }
> = {
  gallina: {
    pollueloHastaMeses: 1,
    crecimientoHastaMeses: 5,
    polluelo: [0.03, 0.3],
    crecimientoHembra: [0.15, 2.3],
    crecimientoMacho: [0.15, 3.2],
    adultoHembra: [1, 4.5],
    adultoMacho: [1.2, 6],
  },
  pato: {
    pollueloHastaMeses: 1,
    crecimientoHastaMeses: 5,
    polluelo: [0.05, 0.8],
    crecimientoHembra: [0.3, 3.5],
    crecimientoMacho: [0.3, 5],
    adultoHembra: [1.2, 5],
    adultoMacho: [1.5, 7.5],
  },
  pavo: {
    pollueloHastaMeses: 1,
    crecimientoHastaMeses: 6,
    polluelo: [0.05, 1],
    crecimientoHembra: [0.3, 8],
    crecimientoMacho: [0.3, 12],
    adultoHembra: [3, 15],
    adultoMacho: [4, 30],
  },
  codorniz: {
    pollueloHastaMeses: 1,
    crecimientoHastaMeses: 2,
    polluelo: [0.003, 0.08],
    crecimientoHembra: [0.04, 0.35],
    crecimientoMacho: [0.04, 0.35],
    adultoHembra: [0.08, 0.5],
    adultoMacho: [0.08, 0.4],
  },
  ganso: {
    pollueloHastaMeses: 1,
    crecimientoHastaMeses: 6,
    polluelo: [0.08, 1],
    crecimientoHembra: [0.3, 7],
    crecimientoMacho: [0.3, 9],
    adultoHembra: [3, 12],
    adultoMacho: [4, 16],
  },
};

export interface EvaluacionOviparo {
  edadMeses: number | null;
  etapa: string;
  postura: string | null;
  alertas: AlertaBiologica[];
}

export function validarPesoEdadOviparo(params: {
  especie: EspecieOvipara;
  fechaNacimiento: string;
  sexo: 'macho' | 'hembra';
  peso: number | null | undefined;
  proposito?: PropositoOviparo | '';
  raza?: string;
}): EvaluacionOviparo {
  const edadMeses = calcularEdadMeses(params.fechaNacimiento);
  if (edadMeses === null) {
    return { edadMeses: null, etapa: '', postura: null, alertas: [] };
  }

  const biologicos = PARAMETROS_BIOLOGICOS[params.especie];
  let etapa = 'Ave adulta';
  if (edadMeses <= biologicos.pollueloHastaMeses) {
    etapa = 'Polluelo';
  } else if (edadMeses <= biologicos.crecimientoHastaMeses) {
    etapa = 'Ave en crecimiento';
  }
  const propositoPoneHuevos =
    params.proposito === 'huevos' ||
    params.proposito === 'doble_proposito' ||
    params.proposito === 'reproduccion';
  const inicioPostura = EDAD_INICIO_POSTURA_MESES[params.especie];
  const puedePonerHuevos = params.sexo === 'hembra' && propositoPoneHuevos;
  const esPrepostura = puedePonerHuevos && edadMeses < inicioPostura;
  let postura: string | null = null;
  if (esPrepostura) {
    postura = `Prepostura (inicio orientativo desde ${inicioPostura} meses)`;
  } else if (puedePonerHuevos) {
    postura = 'Edad compatible con postura';
  }
  const alertas: AlertaBiologica[] = [];

  if (params.peso !== undefined && params.peso !== null && Number.isFinite(params.peso) && params.peso > 0) {
    let grupoPeso = biologicos.adultoMacho;
    if (edadMeses <= biologicos.pollueloHastaMeses) {
      grupoPeso = biologicos.polluelo;
    } else if (edadMeses <= biologicos.crecimientoHastaMeses) {
      grupoPeso = params.sexo === 'hembra'
        ? biologicos.crecimientoHembra
        : biologicos.crecimientoMacho;
    } else if (params.sexo === 'hembra') {
      grupoPeso = biologicos.adultoHembra;
    }
    let factorRaza = 1;
    if (/(broiler|ross|cobb|broad breasted)/i.test(params.raza || '')) factorRaza = 1.25;
    if (/(leghorn|hy-line|isa brown|lohmann|coturnix|khaki campbell|indian runner|chinese goose)/i.test(params.raza || '')) {
      factorRaza = 0.85;
    }
    const minimo = grupoPeso[0] * factorRaza;
    const maximo = grupoPeso[1] * factorRaza;
    if (params.peso < minimo) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `El peso (${params.peso} kg) está por debajo del rango orientativo para ${etapa.toLowerCase()} de ${params.especie} (${minimo}-${maximo} kg).`,
      });
    } else if (params.peso > maximo) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `El peso (${params.peso} kg) supera el rango orientativo para ${etapa.toLowerCase()} de ${params.especie} (${minimo}-${maximo} kg). Verifique raza, sexo y digitación.`,
      });
    }
  }

  if (esPrepostura && edadMeses >= Math.max(0, inicioPostura - 1)) {
    alertas.push({
      tipo: 'info',
      mensaje: `Ave próxima al inicio orientativo de postura para ${params.especie} (aproximadamente ${inicioPostura} meses).`,
    });
  }

  return { edadMeses, etapa, postura, alertas };
}
