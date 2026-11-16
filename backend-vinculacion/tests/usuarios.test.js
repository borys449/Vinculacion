const usuariosRouter = require('../routes/usuarios');
const { crearOperador } = require('../controllers/usuarioController');
const { Usuario } = require('../models');

describe('routes/usuarios.js', () => {
	test('exports an express router', () => {
		expect(typeof usuariosRouter.use).toBe('function');
	});

	describe('crearOperador / crearUsuario', () => {
		let req, res;

		beforeEach(() => {
			req = {
				usuario: { id: 1, fincaId: 2, tipo: 'administrador' },
				body: {
					nombre: 'Pedro Ramirez',
					cedula: '1312345678',
					email: 'pedro@finca.com',
					telefono: '0987654321',
					area: 'ganaderia',
					tipo: 'administrador',
					password: 'secretPassword123',
					confirmPassword: 'secretPassword123',
				},
			};
			res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};
			jest.clearAllMocks();
		});

		test('crea exitosamente un usuario administrador con fincaId', async () => {
			jest.spyOn(Usuario, 'findOne').mockResolvedValue(null);
			const mockCreated = {
				id: 20,
				...req.body,
				fincaId: 2,
				activo: true,
				toJSON: () => ({ id: 20, nombre: req.body.nombre, email: req.body.email, tipo: req.body.tipo }),
			};
			jest.spyOn(Usuario, 'create').mockResolvedValue(mockCreated);

			await crearOperador(req, res);

			expect(Usuario.create).toHaveBeenCalledWith(expect.objectContaining({
				nombre: 'Pedro Ramirez',
				area: 'ganaderia',
				tipo: 'administrador',
				fincaId: 2,
			}));
			expect(res.status).toHaveBeenCalledWith(201);
		});

		test('rechaza si las contraseñas no coinciden', async () => {
			req.body.confirmPassword = 'diferentePassword';

			await crearOperador(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				success: false,
				message: 'Las contraseñas no coinciden',
			}));
		});
	});
});
