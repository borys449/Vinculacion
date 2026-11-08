/**
 * Utilidades para Lógica de Negocio de Ganadería y Control Lechero
 */

/**
 * Calcula la edad en meses a partir de la fecha de nacimiento
 * @param {string|Date} fechaNacimiento 
 * @param {Date} fechaReferencia 
 * @returns {number|null}
 */
function calcularEdadEnMeses(fechaNacimiento, fechaReferencia = new Date()) {
  if (!fechaNacimiento) return null;
  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return null;

  let meses = (fechaReferencia.getFullYear() - nacimiento.getFullYear()) * 12 + 
              (fechaReferencia.getMonth() - nacimiento.getMonth());
  if (fechaReferencia.getDate() < nacimiento.getDate()) {
    meses--;
  }
  return Math.max(0, meses);
}

/**
 * Validaciones biológicas (Edad vs. Peso) según especificación técnica
 * Bovinos:
 *   0 a 1 mes (Recién nacido): 25 - 50 kg (Alerta < 20 kg o > 60 kg)
 *   2 a 6 meses (Ternero): 60 - 180 kg (Alerta desnutrición < 50 kg)
 *   > 24 meses (Adulto): 350 - 750+ kg (Alerta < 350 kg)
 * Porcinos:
 *   0 a 1 mes (Lechón lactante): 1.2 - 10 kg (Alerta < 1.0 kg o > 15 kg)
 *   2 a 3 meses (Lechón destetado / Recría): 15 - 50 kg (Alerta desnutrición < 12 kg o > 65 kg)
 *   4 a 6 meses (Crecimiento y engorde / Cebo): 45 - 130 kg (Alerta < 40 kg o > 160 kg)
 *   > 6 meses (Adulto / Reproductor): 120 - 350+ kg (Alerta < 90 kg o > 420 kg)
 *
 * @param {Object} params
 * @param {string} params.tipo
 * @param {string|Date} params.fechaNacimiento
 * @param {number|string} params.peso
 * @returns {{ edadMeses: number|null, advertencias: string[], errorCritico?: boolean }}
 */
function validarRangosBiologicos({ tipo, fechaNacimiento, peso }) {
  const advertencias = [];
  if (peso === undefined || peso === null || isNaN(parseFloat(peso))) {
    return { edadMeses: null, advertencias };
  }

  const pesoNum = parseFloat(peso);
  if (pesoNum < 0) {
    advertencias.push('El peso no puede ser negativo.');
    return { edadMeses: null, advertencias, errorCritico: true };
  }

  const tipoNormalizado = tipo ? tipo.toLowerCase().trim() : '';

  // Aplicable a bovinos y porcinos
  if (tipoNormalizado !== 'bovino' && tipoNormalizado !== 'porcino') {
    return { edadMeses: null, advertencias };
  }

  const edadMeses = calcularEdadEnMeses(fechaNacimiento);
  if (edadMeses === null) {
    return { edadMeses: null, advertencias };
  }

  // Validaciones para Bovinos
  if (tipoNormalizado === 'bovino') {
    // 0 a 1 mes (Recién nacido)
    if (edadMeses <= 1) {
      if (pesoNum < 20) {
        advertencias.push(
          `Alerta biológica: El peso ingresado (${pesoNum.toFixed(1)} kg) es inferior al mínimo biológico para un recién nacido (0-1 mes). Rango esperado: 25 - 50 kg (Alerta < 20 kg).`
        );
      } else if (pesoNum > 60) {
        advertencias.push(
          `Alerta biológica: El peso ingresado (${pesoNum.toFixed(1)} kg) excede el umbral máximo para un recién nacido (0-1 mes). Rango esperado: 25 - 50 kg (Alerta > 60 kg).`
        );
      }
    }
    // 2 a 6 meses (Ternero)
    else if (edadMeses >= 2 && edadMeses <= 6) {
      if (pesoNum < 50) {
        advertencias.push(
          `Alerta de desnutrición: Peso crítico (${pesoNum.toFixed(1)} kg < 50 kg) para ternero de ${edadMeses} meses. Rango esperado: 60 - 180 kg.`
        );
      } else if (pesoNum < 60) {
        advertencias.push(
          `Advertencia biológica: El peso (${pesoNum.toFixed(1)} kg) se encuentra por debajo del promedio esperado (60 - 180 kg) para terneros de 2 a 6 meses.`
        );
      } else if (pesoNum > 180) {
        advertencias.push(
          `Advertencia biológica: El peso (${pesoNum.toFixed(1)} kg) supera el rango típico (60 - 180 kg) para la etapa de ternero.`
        );
      }
    }
    // > 24 meses (Adulto)
    else if (edadMeses > 24) {
      if (pesoNum < 350) {
        advertencias.push(
          `Alerta biológica: El peso (${pesoNum.toFixed(1)} kg) está por debajo del rango esperado para un bovino adulto (> 24 meses). Rango esperado: 350 - 750+ kg.`
        );
      }
    }
  }

  // Validaciones para Porcinos
  else if (tipoNormalizado === 'porcino') {
    // 0 a 1 mes: Lechón lactante
    if (edadMeses <= 1) {
      if (pesoNum < 1.0) {
        advertencias.push(
          `Alerta biológica: Para un lechón lactante (0-1 mes), el peso ingresado (${pesoNum.toFixed(1)} kg) está por debajo del mínimo crítico (< 1.0 kg). Rango esperado: 1.2 - 10 kg.`
        );
      } else if (pesoNum < 1.2) {
        advertencias.push(
          `Advertencia biológica: El peso (${pesoNum.toFixed(1)} kg) está por debajo del promedio esperado (1.2 - 10 kg) para un lechón lactante.`
        );
      } else if (pesoNum > 15) {
        advertencias.push(
          `Advertencia biológica: El peso ingresado (${pesoNum.toFixed(1)} kg) supera el rango esperado para un lechón lactante (0-1 mes).`
        );
      }
    }
    // 2 a 3 meses: Lechón destetado / Recría
    else if (edadMeses >= 2 && edadMeses <= 3) {
      if (pesoNum < 12) {
        advertencias.push(
          `Alerta de desnutrición: Peso crítico (${pesoNum.toFixed(1)} kg < 12 kg) para lechón en etapa de recría (${edadMeses} meses). Rango esperado: 15 - 50 kg.`
        );
      } else if (pesoNum < 15) {
        advertencias.push(
          `Advertencia biológica: El peso (${pesoNum.toFixed(1)} kg) está por debajo del rango esperado (15 - 50 kg) para lechones destetados de 2 a 3 meses.`
        );
      } else if (pesoNum > 65) {
        advertencias.push(
          `Advertencia biológica: El peso (${pesoNum.toFixed(1)} kg) supera el rango esperado (15 - 50 kg) para un lechón de ${edadMeses} meses.`
        );
      }
    }
    // 4 a 6 meses: Crecimiento y engorde (Cebo)
    else if (edadMeses >= 4 && edadMeses <= 6) {
      if (pesoNum < 40) {
        advertencias.push(
          `Alerta de retraso en engorde: Peso insuficiente (${pesoNum.toFixed(1)} kg < 40 kg) para cerdo en etapa de cebo (${edadMeses} meses). Rango esperado: 45 - 130 kg.`
        );
      } else if (pesoNum < 45) {
        advertencias.push(
          `Advertencia biológica: El peso (${pesoNum.toFixed(1)} kg) está por debajo de la meta de desarrollo (45 - 130 kg) para cerdos de 4 a 6 meses.`
        );
      } else if (pesoNum > 160) {
        advertencias.push(
          `Advertencia biológica: El peso (${pesoNum.toFixed(1)} kg) excede el estándar de salida para cerdos de engorde de ${edadMeses} meses.`
        );
      }
    }
    // > 6 meses: Cerdo adulto / Reproductor
    else if (edadMeses > 6) {
      if (pesoNum < 90) {
        advertencias.push(
          `Alerta biológica: Para un porcino adulto o reproductor (> 6 meses, edad: ${edadMeses} meses), el peso (${pesoNum.toFixed(1)} kg) es bajo. Rango esperado: 120 - 350+ kg.`
        );
      } else if (pesoNum > 420) {
        advertencias.push(
          `Advertencia biológica: El peso (${pesoNum.toFixed(1)} kg) es inusualmente alto incluso para un reproductor porcino adulto.`
        );
      }
    }
  }

  return { edadMeses, advertencias };
}

/**
 * Lógica Híbrida de Producción Lechera (Estimada vs. Real)
 * @param {Object} animal 
 * @param {Array} registrosMes - Array de registros de tipo 'leche' del mes actual
 * @param {Date} fechaHoy 
 * @returns {Object} Estadísticas lecheras calculadas
 */
function calcularProduccionLechera(animal, registrosMes = [], fechaHoy = new Date()) {
  const produccionEstimadaDiaria = parseFloat(animal.produccionEstimadaDiaria || 0);
  const produccionMensualEstimada = parseFloat((produccionEstimadaDiaria * 30).toFixed(2));

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const hoyStr = fechaHoy.toISOString().split('T')[0];

  // Identificar días únicos con registros en el mes
  const diasConRegistroSet = new Set();
  let sumaLitrosMesActual = 0;
  let produccionHoy = 0;

  for (const reg of registrosMes) {
    const litros = parseFloat(reg.cantidad || 0);
    const regFechaStr = (reg.fecha instanceof Date ? reg.fecha.toISOString() : String(reg.fecha)).split('T')[0];
    
    diasConRegistroSet.add(regFechaStr);
    sumaLitrosMesActual += litros;

    if (regFechaStr === hoyStr) {
      produccionHoy += litros;
    }
  }

  const diasConRegistro = diasConRegistroSet.size;
  const tieneRegistros = diasConRegistro > 0;

  let promedioDiarioReal = 0;
  let totalMensualReal = 0;
  let promedioDiarioCalculado = produccionEstimadaDiaria;
  let totalMensualCalculado = produccionMensualEstimada;
  let esEstimado = true;

  if (tieneRegistros) {
    promedioDiarioReal = parseFloat((sumaLitrosMesActual / diasConRegistro).toFixed(2));
    totalMensualReal = parseFloat(sumaLitrosMesActual.toFixed(2));
    promedioDiarioCalculado = promedioDiarioReal;
    totalMensualCalculado = totalMensualReal;
    esEstimado = false;
  }

  return {
    ganadoId: animal.id,
    identificacion: animal.identificacion,
    raza: animal.raza,
    proposito: animal.proposito,
    produccionEstimadaDiaria,
    produccionMensualEstimada,
    tieneRegistros,
    esEstimado,
    diasConRegistro,
    produccionHoy: parseFloat(produccionHoy.toFixed(2)),
    promedioDiarioReal,
    totalMensualReal,
    promedioDiarioCalculado,
    totalMensualCalculado,
    proyeccionMensual: parseFloat((promedioDiarioCalculado * 30).toFixed(2)),
  };
}

module.exports = {
  calcularEdadEnMeses,
  validarRangosBiologicos,
  calcularProduccionLechera,
};
