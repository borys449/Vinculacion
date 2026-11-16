const jwt = require('jsonwebtoken');

jest.mock('../models', () => ({
  Usuario: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Finca: {
    create: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const { Usuario, Finca } = require('../models');
const authController = require('../controllers/authController');
const { createMockResponse, buildRegistroBody } = require('./helpers/authTestUtils');

describe('Registro con nombreFinca', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  test('crea la finca con el nombre especificado en nombreFinca', async () => {
    Usuario.findOne.mockResolvedValue(null);
    const mockUsuario = {
      id: 10,
      nombre: 'Carlos Propietario',
      email: 'carlos@example.com',
      tipo: 'administrador',
      area: 'administracion',
      update: jest.fn().mockResolvedValue(true),
    };
    Usuario.create.mockResolvedValue(mockUsuario);
    Finca.create.mockResolvedValue({
      id: 5,
      nombre: 'Hacienda San José',
      poligonoPerimetro: null,
    });
    jwt.sign.mockReturnValue('token-finca');

    const req = {
      body: buildRegistroBody({
        nombre: 'Carlos Propietario',
        nombreFinca: 'Hacienda San José',
      }),
    };
    const res = createMockResponse();

    await authController.registro(req, res);

    expect(Finca.create).toHaveBeenCalledWith({
      nombre: 'Hacienda San José',
      poligonoPerimetro: null,
      propietarioId: 10,
    });
    expect(mockUsuario.update).toHaveBeenCalledWith({ fincaId: 5 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          fincaId: 5,
          finca: expect.objectContaining({
            id: 5,
            nombre: 'Hacienda San José',
          }),
        }),
      })
    );
  });
});
