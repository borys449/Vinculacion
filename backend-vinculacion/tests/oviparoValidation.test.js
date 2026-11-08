const { validationResult } = require('express-validator');
const { validateGanadoCreate } = require('../middleware/validation');

const purposesBySpecies = {
  gallina: ['huevos', 'carne', 'doble_proposito', 'reproduccion'],
  pato: ['huevos', 'carne', 'doble_proposito'],
  pavo: ['carne', 'reproduccion'],
  codorniz: ['huevos', 'carne', 'reproduccion'],
  ganso: ['huevos', 'carne', 'doble_proposito'],
};

const validateAnimal = async (species, purpose) => {
  const req = {
    body: {
      identificacion: 'AVE-001',
      tipo: 'oviparo',
      especie: species,
      proposito: purpose,
      raza: 'Criollo / Mestizo',
      fechaNacimiento: '2026-01-01',
      sexo: 'hembra',
      estado: 'activo',
    },
  };
  await Promise.all(validateGanadoCreate.map((validation) => validation.run(req)));
  return validationResult(req).array();
};

describe('Validación de registros ovíparos', () => {
  test.each(Object.entries(purposesBySpecies).flatMap(([species, purposes]) =>
    purposes.map((purpose) => [species, purpose])
  ))('acepta %s con propósito %s', async (species, purpose) => {
    await expect(validateAnimal(species, purpose)).resolves.toHaveLength(0);
  });

  test('rechaza un propósito que no corresponde a la especie', async () => {
    const errors = await validateAnimal('pavo', 'huevos');
    expect(errors.some((error) => error.msg.includes('no corresponde'))).toBe(true);
  });
});
