const { obtenerResumenFinanciero } = require('../controllers/registroController');
const { Registro } = require('../models');

// Mockear el modelo Registro
jest.mock('../models', () => ({
  Registro: {
    sum: jest.fn(),
  },
  Usuario: {},
  Cultivo: {},
  Ganado: {},
}));

describe('Registro Controller - obtenerResumenFinanciero', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('debe retornar 200 y el cálculo correcto de ingresos, costos y balance', async () => {
    // Configurar mocks
    Registro.sum.mockImplementation((column) => {
      if (column === 'ingresos') return Promise.resolve(1500.50);
      if (column === 'costo') return Promise.resolve(500.20);
      return Promise.resolve(0);
    });

    await obtenerResumenFinanciero(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        ingresos: 1500.50,
        costos: 500.20,
        balance: 1000.30,
      },
    });
  });

  test('debe retornar 0 si no hay ingresos ni costos', async () => {
    Registro.sum.mockResolvedValue(null);

    await obtenerResumenFinanciero(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        ingresos: 0,
        costos: 0,
        balance: 0,
      },
    });
  });
});
