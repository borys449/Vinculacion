const registrosRouter = require('../routes/registros');
const { obtenerRegistros, obtenerDatosDashboard } = require('../controllers/registroController');
const { Registro } = require('../models');

describe('routes/registros.js', () => {
	test('exports an express router', () => {
		expect(typeof registrosRouter.use).toBe('function');
	});

	describe('Filtrado de lotes en bitácora por área', () => {
		let res;

		beforeEach(() => {
			res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};
			jest.clearAllMocks();
		});

		test('trabajador de ganadería excluye lotes de agricultura', async () => {
			const req = {
				usuario: { id: 2, tipo: 'trabajador', area: 'ganaderia', fincaId: 1 },
				query: { operativos: 'false' },
			};
			jest.spyOn(Registro, 'findAll').mockResolvedValue([]);

			await obtenerRegistros(req, res);

			expect(Registro.findAll).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.anything(),
			}));

			const whereCondition = Registro.findAll.mock.calls[0][0].where;
			const symbols = Object.getOwnPropertySymbols(whereCondition);
			expect(symbols.length).toBeGreaterThan(0);
			const andConditions = whereCondition[symbols[0]];
			const descRule = andConditions.find((c) => c && c.descripcion);
			const descSymbol = Object.getOwnPropertySymbols(descRule.descripcion)[0];
			expect(descRule.descripcion[descSymbol]).toBe('%agricultura%');
		});

		test('trabajador de cultivos excluye lotes de ganadería', async () => {
			const req = {
				usuario: { id: 3, tipo: 'trabajador', area: 'cultivos', fincaId: 1 },
				query: { operativos: 'false' },
			};
			jest.spyOn(Registro, 'findAll').mockResolvedValue([]);

			await obtenerRegistros(req, res);

			expect(Registro.findAll).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.anything(),
			}));

			const whereCondition = Registro.findAll.mock.calls[0][0].where;
			const symbols = Object.getOwnPropertySymbols(whereCondition);
			expect(symbols.length).toBeGreaterThan(0);
			const andConditions = whereCondition[symbols[0]];
			const descRule = andConditions.find((c) => c && c.descripcion);
			const descSymbol = Object.getOwnPropertySymbols(descRule.descripcion)[0];
			expect(descRule.descripcion[descSymbol]).toBe('%ganaderia%');
		});

		test('dashboard stats aplica el mismo filtro de lotes por área en actividad reciente', async () => {
			const req = {
				usuario: { id: 2, tipo: 'trabajador', area: 'ganaderia', fincaId: 1 },
				query: { area: 'ganaderia' },
			};
			jest.spyOn(Registro, 'findAll').mockResolvedValue([]);

			await obtenerDatosDashboard(req, res);

			expect(Registro.findAll).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.anything(),
			}));

			const whereCondition = Registro.findAll.mock.calls[0][0].where;
			const symbols = Object.getOwnPropertySymbols(whereCondition);
			const andConditions = whereCondition[symbols[0]];
			const descRule = andConditions.find((c) => c && c.descripcion);
			const descSymbol = Object.getOwnPropertySymbols(descRule.descripcion)[0];
			expect(descRule.descripcion[descSymbol]).toBe('%agricultura%');
		});
	});
});
