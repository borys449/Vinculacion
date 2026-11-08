const ganadoRouter = require('../routes/ganado');
const {
  calcularEdadEnMeses,
  validarRangosBiologicos,
  calcularProduccionLechera,
} = require('../utils/ganaderiaUtils');

describe('Módulo de Ganadería (Bovinos y Porcinos) - Pruebas Unitarias', () => {
  describe('routes/ganado.js', () => {
    test('exporta un express router con middleware y rutas', () => {
      expect(typeof ganadoRouter.use).toBe('function');
    });
  });

  describe('Lógica de Negocio: Validaciones Biológicas Bovinas (Edad vs. Peso)', () => {
    test('Calcula la edad en meses correctamente', () => {
      const hoy = new Date();
      const hace3Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate());
      expect(calcularEdadEnMeses(hace3Meses, hoy)).toBe(3);
    });

    test('0 a 1 mes (Recién nacido): rango esperado 25 - 50 kg, alerta si < 20 kg', () => {
      const hoy = new Date();
      const hace15Dias = new Date(hoy.getTime() - 15 * 24 * 60 * 60 * 1000);

      // Peso muy bajo (< 20 kg)
      const resBajo = validarRangosBiologicos({
        tipo: 'bovino',
        fechaNacimiento: hace15Dias,
        peso: 18,
      });
      expect(resBajo.advertencias.length).toBeGreaterThan(0);
      expect(resBajo.advertencias[0]).toContain('inferior al mínimo biológico');

      // Peso adecuado (35 kg)
      const resOk = validarRangosBiologicos({
        tipo: 'bovino',
        fechaNacimiento: hace15Dias,
        peso: 35,
      });
      expect(resOk.advertencias.length).toBe(0);

      // Peso excesivo (> 60 kg)
      const resAlto = validarRangosBiologicos({
        tipo: 'bovino',
        fechaNacimiento: hace15Dias,
        peso: 65,
      });
      expect(resAlto.advertencias.length).toBeGreaterThan(0);
      expect(resAlto.advertencias[0]).toContain('excede el umbral máximo');
    });

    test('2 a 6 meses (Ternero): rango esperado 60 - 180 kg, alerta desnutrición si < 50 kg', () => {
      const hoy = new Date();
      const hace4Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 4, hoy.getDate());

      // Alerta de desnutrición (< 50 kg)
      const resDesnutrido = validarRangosBiologicos({
        tipo: 'bovino',
        fechaNacimiento: hace4Meses,
        peso: 45,
      });
      expect(resDesnutrido.advertencias.length).toBeGreaterThan(0);
      expect(resDesnutrido.advertencias[0]).toContain('Alerta de desnutrición');

      // Peso normal en ternero (120 kg)
      const resNormal = validarRangosBiologicos({
        tipo: 'bovino',
        fechaNacimiento: hace4Meses,
        peso: 120,
      });
      expect(resNormal.advertencias.length).toBe(0);
    });

    test('> 24 meses (Adulto): rango esperado 350 - 750+ kg, alerta si < 350 kg', () => {
      const hoy = new Date();
      const hace30Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 30, hoy.getDate());

      // Peso bajo para adulto
      const resBajo = validarRangosBiologicos({
        tipo: 'bovino',
        fechaNacimiento: hace30Meses,
        peso: 300,
      });
      expect(resBajo.advertencias.length).toBeGreaterThan(0);
      expect(resBajo.advertencias[0]).toContain('por debajo del rango esperado para un bovino adulto');

      // Peso adecuado (550 kg)
      const resOk = validarRangosBiologicos({
        tipo: 'bovino',
        fechaNacimiento: hace30Meses,
        peso: 550,
      });
      expect(resOk.advertencias.length).toBe(0);
    });

    test('Rechaza peso negativo como error crítico', () => {
      const resNegativo = validarRangosBiologicos({
        tipo: 'bovino',
        fechaNacimiento: new Date(),
        peso: -10,
      });
      expect(resNegativo.errorCritico).toBe(true);
    });
  });

  describe('Lógica de Negocio: Validaciones Biológicas Porcinas (Edad vs. Peso)', () => {
    test('0 a 1 mes (Lechón lactante): rango esperado 1.2 - 10 kg, alerta si < 1.0 kg o > 15 kg', () => {
      const hoy = new Date();
      const hace20Dias = new Date(hoy.getTime() - 20 * 24 * 60 * 60 * 1000);

      // Peso crítico (< 1.0 kg)
      const resCritico = validarRangosBiologicos({
        tipo: 'porcino',
        fechaNacimiento: hace20Dias,
        peso: 0.8,
      });
      expect(resCritico.advertencias.length).toBeGreaterThan(0);
      expect(resCritico.advertencias[0]).toContain('mínimo crítico');

      // Peso adecuado (6 kg)
      const resOk = validarRangosBiologicos({
        tipo: 'porcino',
        fechaNacimiento: hace20Dias,
        peso: 6,
      });
      expect(resOk.advertencias.length).toBe(0);

      // Peso excesivo (> 15 kg)
      const resAlto = validarRangosBiologicos({
        tipo: 'porcino',
        fechaNacimiento: hace20Dias,
        peso: 18,
      });
      expect(resAlto.advertencias.length).toBeGreaterThan(0);
      expect(resAlto.advertencias[0]).toContain('supera el rango esperado para un lechón lactante');
    });

    test('2 a 3 meses (Lechón destetado / Recría): rango esperado 15 - 50 kg, alerta desnutrición si < 12 kg', () => {
      const hoy = new Date();
      const hace2MesesMedio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, hoy.getDate());

      // Alerta desnutrición
      const resDesnutrido = validarRangosBiologicos({
        tipo: 'porcino',
        fechaNacimiento: hace2MesesMedio,
        peso: 10,
      });
      expect(resDesnutrido.advertencias.length).toBeGreaterThan(0);
      expect(resDesnutrido.advertencias[0]).toContain('Alerta de desnutrición');

      // Peso normal en recría (28 kg)
      const resNormal = validarRangosBiologicos({
        tipo: 'porcino',
        fechaNacimiento: hace2MesesMedio,
        peso: 28,
      });
      expect(resNormal.advertencias.length).toBe(0);
    });

    test('4 a 6 meses (Crecimiento y engorde): rango esperado 45 - 130 kg, alerta retraso si < 40 kg', () => {
      const hoy = new Date();
      const hace5Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 5, hoy.getDate());

      // Retraso en engorde (< 40 kg)
      const resBajo = validarRangosBiologicos({
        tipo: 'porcino',
        fechaNacimiento: hace5Meses,
        peso: 35,
      });
      expect(resBajo.advertencias.length).toBeGreaterThan(0);
      expect(resBajo.advertencias[0]).toContain('Alerta de retraso en engorde');

      // Peso adecuado de mercado (105 kg)
      const resMercado = validarRangosBiologicos({
        tipo: 'porcino',
        fechaNacimiento: hace5Meses,
        peso: 105,
      });
      expect(resMercado.advertencias.length).toBe(0);
    });

    test('> 6 meses (Adulto / Reproductor): rango esperado 120 - 350+ kg, alerta si < 90 kg', () => {
      const hoy = new Date();
      const hace10Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 10, hoy.getDate());

      // Bajo peso para reproductor
      const resBajo = validarRangosBiologicos({
        tipo: 'porcino',
        fechaNacimiento: hace10Meses,
        peso: 75,
      });
      expect(resBajo.advertencias.length).toBeGreaterThan(0);
      expect(resBajo.advertencias[0]).toContain('Alerta biológica');

      // Reproductor óptimo (220 kg)
      const resOk = validarRangosBiologicos({
        tipo: 'porcino',
        fechaNacimiento: hace10Meses,
        peso: 220,
      });
      expect(resOk.advertencias.length).toBe(0);
    });
  });

  describe('Lógica Híbrida de Producción Lechera (Estimada vs. Real)', () => {
    test('1. Sin registros previos: usa produccionEstimadaDiaria y proyección a 30 días', () => {
      const animal = {
        id: 1,
        identificacion: 'VACA-001',
        raza: 'Holstein Friesian',
        proposito: 'leche',
        produccionEstimadaDiaria: 18.5,
      };

      const resultado = calcularProduccionLechera(animal, []);

      expect(resultado.tieneRegistros).toBe(false);
      expect(resultado.esEstimado).toBe(true);
      expect(resultado.promedioDiarioCalculado).toBe(18.5);
      expect(resultado.produccionMensualEstimada).toBe(555.0); // 18.5 * 30
      expect(resultado.totalMensualReal).toBe(0);
      expect(resultado.diasConRegistro).toBe(0);
    });

    test('2. Con registros previos: calcula Promedio Diario Real y Total Mensual Real', () => {
      const animal = {
        id: 2,
        identificacion: 'VACA-002',
        raza: 'Girolando',
        proposito: 'leche',
        produccionEstimadaDiaria: 12.0,
      };

      // Registros en 3 días distintos: 20L día 1, 22L día 2 (2 ordeños de 11L), 18L día 3
      const fechaHoy = new Date('2026-09-20T10:00:00Z');
      const registros = [
        { fecha: '2026-09-18T06:00:00Z', cantidad: 20 },
        { fecha: '2026-09-19T06:00:00Z', cantidad: 11 },
        { fecha: '2026-09-19T16:00:00Z', cantidad: 11 }, // Mismo día
        { fecha: '2026-09-20T06:00:00Z', cantidad: 18 }, // Hoy
      ];

      const resultado = calcularProduccionLechera(animal, registros, fechaHoy);

      expect(resultado.tieneRegistros).toBe(true);
      expect(resultado.esEstimado).toBe(false);
      expect(resultado.diasConRegistro).toBe(3); // 18, 19, 20
      expect(resultado.totalMensualReal).toBe(60); // 20 + 11 + 11 + 18
      expect(resultado.promedioDiarioReal).toBe(20); // 60 / 3
      expect(resultado.promedioDiarioCalculado).toBe(20);
      expect(resultado.produccionHoy).toBe(18);
      expect(resultado.proyeccionMensual).toBe(600); // 20 * 30
    });
  });
});
