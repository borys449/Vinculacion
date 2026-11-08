const RANGOS_OVIPAROS = {
  gallina: {
    pollueloHasta: 1, crecimientoHasta: 5, inicioPostura: 5,
    polluelo: [0.03, 0.3], crecimientoHembra: [0.15, 2.3],
    crecimientoMacho: [0.15, 3.2], adultaHembra: [1, 4.5], adultoMacho: [1.2, 6],
  },
  pato: {
    pollueloHasta: 1, crecimientoHasta: 5, inicioPostura: 6,
    polluelo: [0.05, 0.8], crecimientoHembra: [0.3, 3.5],
    crecimientoMacho: [0.3, 5], adultaHembra: [1.2, 5], adultoMacho: [1.5, 7.5],
  },
  pavo: {
    pollueloHasta: 1, crecimientoHasta: 6, inicioPostura: 7,
    polluelo: [0.05, 1], crecimientoHembra: [0.3, 8],
    crecimientoMacho: [0.3, 12], adultaHembra: [3, 15], adultoMacho: [4, 30],
  },
  codorniz: {
    pollueloHasta: 1, crecimientoHasta: 2, inicioPostura: 2,
    polluelo: [0.003, 0.08], crecimientoHembra: [0.04, 0.35],
    crecimientoMacho: [0.04, 0.35], adultaHembra: [0.08, 0.5], adultoMacho: [0.08, 0.4],
  },
  ganso: {
    pollueloHasta: 1, crecimientoHasta: 6, inicioPostura: 9,
    polluelo: [0.08, 1], crecimientoHembra: [0.3, 7],
    crecimientoMacho: [0.3, 9], adultaHembra: [3, 12], adultoMacho: [4, 16],
  },
};

function validarRangosOviparo({ especie, sexo, proposito, raza, edadMeses, pesoNum }) {
  const configuracion = RANGOS_OVIPAROS[especie];
  if (!configuracion) {
    return { edadMeses: null, advertencias: [], etapa: null, postura: null };
  }

  if (edadMeses === null) {
    return { edadMeses: null, advertencias: [], etapa: null, postura: null };
  }

  let etapa = 'Ave adulta';
  if (edadMeses <= configuracion.pollueloHasta) {
    etapa = 'Polluelo';
  } else if (edadMeses <= configuracion.crecimientoHasta) {
    etapa = 'Ave en crecimiento';
  }
  const esHembra = sexo === 'hembra';
  let limites = esHembra ? configuracion.adultaHembra : configuracion.adultoMacho;
  if (edadMeses <= configuracion.pollueloHasta) {
    limites = configuracion.polluelo;
  } else if (edadMeses <= configuracion.crecimientoHasta) {
    limites = esHembra ? configuracion.crecimientoHembra : configuracion.crecimientoMacho;
  }

  let factorRaza = 1;
  if (/(broiler|ross|cobb|broad breasted)/i.test(raza || '')) factorRaza = 1.25;
  if (/(leghorn|hy-line|isa brown|lohmann|coturnix|khaki campbell|indian runner|chinese goose)/i.test(raza || '')) {
    factorRaza = 0.85;
  }
  const minimo = limites[0] * factorRaza;
  const maximo = limites[1] * factorRaza;
  const advertencias = [];
  if (Number.isFinite(pesoNum)) {
    if (pesoNum < minimo) {
      advertencias.push(
        `Peso bajo orientativo para ${especie} ${sexo} en etapa ${etapa.toLowerCase()}: ${pesoNum.toFixed(2)} kg (rango aproximado ${minimo.toFixed(2)}-${maximo.toFixed(2)} kg; puede variar según raza y manejo).`
      );
    } else if (pesoNum > maximo) {
      advertencias.push(
        `Peso alto orientativo para ${especie} ${sexo} en etapa ${etapa.toLowerCase()}: ${pesoNum.toFixed(2)} kg (rango aproximado ${minimo.toFixed(2)}-${maximo.toFixed(2)} kg; verifique raza y digitación).`
      );
    }
  }

  let postura = null;
  if (esHembra && ['huevos', 'doble_proposito', 'reproduccion'].includes(proposito)) {
    postura = edadMeses < configuracion.inicioPostura
      ? `Prepostura; inicio orientativo desde ${configuracion.inicioPostura} meses`
      : 'Edad compatible con postura';
    if (edadMeses >= configuracion.inicioPostura - 1 && edadMeses < configuracion.inicioPostura) {
      advertencias.push(
        `Ave próxima al inicio orientativo de postura para ${especie} (aproximadamente ${configuracion.inicioPostura} meses).`
      );
    }
  }

  return { edadMeses, advertencias, etapa, postura };
}

module.exports = { validarRangosOviparo };
