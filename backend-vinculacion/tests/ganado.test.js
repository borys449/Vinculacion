const ganadoRouter = require('../routes/ganado');
const {
  calcularEdadEnMeses,
  validarRangosBiologicos,
  calcularProduccionLechera,
} = require('../utils/ganaderiaUtils');

describe('Módulo de Ganadería (Bovinos) - Pruebas Unitarias', () => {
  describe('routes/ganado.js', () => {
    test('exporta un express router con middleware y rutas', () => {
      expect(typeof ganadoRouter.use).toBe('function');
    });
  });

  describe('Lógica de Negocio: Validaciones Biológicas (Edad vs. Peso)', () => {
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
