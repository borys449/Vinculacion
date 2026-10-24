const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mocks compartidos para probar el controller sin conectar a la base de datos real.
jest.mock('../models', () => ({
	Usuario: {
		findOne: jest.fn(),
		create: jest.fn(),
		findByPk: jest.fn(),
	},
}));

// Mocks para controlar la generación y verificación del JWT sin depender de una clave real.
jest.mock('jsonwebtoken', () => ({
	sign: jest.fn(),
	verify: jest.fn(),
}));

jest.mock('bcrypt', () => ({
	compare: jest.fn(),
}));

const { Usuario } = require('../models');
const authController = require('../controllers/authController');
const {
	buildRegistroBody,
	buildRegistroCreatePayload,
	buildLoginBody,
	buildUpdateProfileBody,
	buildChangePasswordBody,
	createMockResponse,
	createUsuarioMock,
} = require('./helpers/authTestUtils');

// Limpia los mocks antes de cada prueba para que no haya contaminación entre casos.
beforeEach(() => {
	jest.clearAllMocks();
	process.env.JWT_SECRET = 'test-secret';
});

describe('authController.js', () => {
	describe('registro', () => {
		test('rechaza el registro si las contraseñas no coinciden', async () => {
			// Prepara una petición con contraseñas diferentes para disparar la validación inicial.
			const req = {
				body: buildRegistroBody({
					confirmPassword: '654321',
				}),
			};
			const res = createMockResponse();

			await authController.registro(req, res);

			// Verifica que la función corta el flujo antes de consultar la base de datos.
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'Las contraseñas no coinciden',
			});
			expect(Usuario.findOne).not.toHaveBeenCalled();
			expect(Usuario.create).not.toHaveBeenCalled();
		});

		test('rechaza el registro cuando ya existe un usuario con el mismo email o cédula', async () => {
			// Simula que ya existe un usuario para bloquear un duplicado.
			Usuario.findOne.mockResolvedValue({ id: 1 });

			const req = {
				body: buildRegistroBody(),
			};
			const res = createMockResponse();

			await authController.registro(req, res);

			// Verifica que el controlador detecta el duplicado y detiene la creación.
			expect(Usuario.findOne).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'El usuario ya existe con este email o cédula',
			});
			expect(Usuario.create).not.toHaveBeenCalled();
		});

		test('crea el usuario y devuelve token cuando los datos son válidos', async () => {
			// Simula que no existe un usuario previo y que la creación fue exitosa.
			Usuario.findOne.mockResolvedValue(null);
			Usuario.create.mockResolvedValue({
				id: 7,
				nombre: 'Ana',
				email: 'ana@example.com',
				tipo: 'administrador',
				area: 'administracion',
			});
			jwt.sign.mockReturnValue('token-falso');

			const req = {
				body: buildRegistroBody(),
			};
			const res = createMockResponse();

			await authController.registro(req, res);

			// Comprueba que el controlador crea el usuario y devuelve la respuesta esperada.
			expect(Usuario.findOne).toHaveBeenCalledTimes(1);
			expect(Usuario.create).toHaveBeenCalledWith(buildRegistroCreatePayload());
			expect(jwt.sign).toHaveBeenCalledWith({ id: 7 }, 'test-secret', {
				expiresIn: '30d',
			});
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.cookie).toHaveBeenCalledWith('token', 'token-falso', expect.any(Object));
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				message: 'Usuario registrado exitosamente',
				data: {
					id: 7,
					nombre: 'Ana',
					email: 'ana@example.com',
					tipo: 'administrador',
					area: 'administracion',
				},
			});
		});
	});

	describe('login', () => {
		test('rechaza el login si faltan credenciales', async () => {
			// Omite usuario y contraseña para verificar la validación básica del controlador.
			const req = { body: {} };
			const res = createMockResponse();

			await authController.login(req, res);

			// Asegura que el controlador responde con error sin consultar la base de datos.
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'Por favor ingrese email/cédula y contraseña',
			});
			expect(Usuario.findOne).not.toHaveBeenCalled();
		});

		test('rechaza el login cuando el usuario no existe', async () => {
			// Simula que la búsqueda no encuentra coincidencias en la base de datos.
			Usuario.findOne.mockResolvedValue(null);

			const req = {
				body: buildLoginBody(),
			};
			const res = createMockResponse();

			await authController.login(req, res);

			// Verifica que el controlador no permite continuar si no hay usuario.
			expect(Usuario.findOne).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'Credenciales inválidas',
			});
		});

		test('rechaza el login cuando la contraseña no coincide', async () => {
			// Crea un usuario falso cuyo método de comparación devuelve false.
			const usuarioFalso = createUsuarioMock({
				matchPassword: jest.fn().mockResolvedValue(false),
			});
			Usuario.findOne.mockResolvedValue(usuarioFalso);

			const req = {
				body: buildLoginBody({ password: 'incorrecta' }),
			};
			const res = createMockResponse();

			await authController.login(req, res);

			// Confirma que el controlador valida la contraseña antes de generar el token.
			expect(usuarioFalso.matchPassword).toHaveBeenCalledWith('incorrecta');
			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'Credenciales inválidas',
			});
			expect(jwt.sign).not.toHaveBeenCalled();
		});

		test('autentica al usuario y devuelve token cuando las credenciales son correctas', async () => {
			// Crea un usuario falso con contraseña válida para probar el flujo exitoso.
			const usuarioFalso = createUsuarioMock({
				matchPassword: jest.fn().mockResolvedValue(true),
			});
			Usuario.findOne.mockResolvedValue(usuarioFalso);
			jwt.sign.mockReturnValue('token-login');

			const req = {
				body: buildLoginBody(),
			};
			const res = createMockResponse();

			await authController.login(req, res);

			// Verifica que el token se genera solo después de validar la contraseña.
			expect(usuarioFalso.matchPassword).toHaveBeenCalledWith('123456');
			expect(jwt.sign).toHaveBeenCalledWith({ id: 7 }, 'test-secret', {
				expiresIn: '30d',
			});
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.cookie).toHaveBeenCalledWith('token', 'token-login', expect.any(Object));
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				message: 'Login exitoso',
				data: {
					id: 7,
					nombre: 'Ana',
					email: 'ana@example.com',
					tipo: 'administrador',
					area: 'administracion',
					cedula: '1234567890',
				},
			});
		});
	});

	describe('getMe', () => {
		test('devuelve el usuario autenticado excluyendo la contraseña', async () => {
			// Simula el usuario autenticado ya resuelto por el middleware protect.
			Usuario.findByPk.mockResolvedValue({
				id: 7,
				nombre: 'Ana',
				email: 'ana@example.com',
				tipo: 'administrador',
				area: 'administracion',
			});

			const req = { usuario: { id: 7 } };
			const res = createMockResponse();

			await authController.getMe(req, res);

			// Verifica que el controlador consulta por ID y excluye el campo password.
			expect(Usuario.findByPk).toHaveBeenCalledWith(7, {
				attributes: { exclude: ['password'] },
			});
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				data: {
					id: 7,
					nombre: 'Ana',
					email: 'ana@example.com',
					tipo: 'administrador',
					area: 'administracion',
				},
			});
		});
	});

	describe('updateProfile', () => {
		test('rechaza la actualización cuando el usuario no existe', async () => {
			// Simula que el ID autenticado no coincide con ningún registro real.
			Usuario.findByPk.mockResolvedValue(null);

			const req = {
				usuario: { id: 7 },
				body: buildUpdateProfileBody(),
			};
			const res = createMockResponse();

			await authController.updateProfile(req, res);

			// Verifica que el controlador detiene el flujo con un 404.
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'Usuario no encontrado',
			});
		});

		test('rechaza la actualización cuando el nuevo email ya está en uso', async () => {
			// Simula un usuario existente y un correo ya ocupado por otra cuenta.
			const usuarioActual = createUsuarioMock({
				update: jest.fn(),
			});
			Usuario.findByPk.mockResolvedValue(usuarioActual);
			Usuario.findOne.mockResolvedValue({ id: 8 });

			const req = {
				usuario: { id: 7 },
				body: buildUpdateProfileBody({ email: 'ocupado@example.com' }),
			};
			const res = createMockResponse();

			await authController.updateProfile(req, res);

			// Verifica que el controlador bloquea el cambio antes de actualizar el modelo.
			expect(Usuario.findOne).toHaveBeenCalledWith({
				where: { email: 'ocupado@example.com' },
			});
			expect(usuarioActual.update).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'El email ya está en uso',
			});
		});

		test('actualiza el perfil cuando los datos son válidos', async () => {
			// Simula un usuario existente que acepta cambios de perfil.
			const usuarioActual = createUsuarioMock({
				update: jest.fn().mockResolvedValue(true),
			});
			Usuario.findByPk.mockResolvedValueOnce(usuarioActual).mockResolvedValueOnce({
				id: 7,
				nombre: 'Ana Nueva',
				email: 'ana.nueva@example.com',
				telefono: '0988888888',
			});
			Usuario.findOne.mockResolvedValue(null);

			const req = {
				usuario: { id: 7 },
				body: buildUpdateProfileBody(),
			};
			const res = createMockResponse();

			await authController.updateProfile(req, res);

			// Verifica que el controlador aplica el cambio y luego devuelve el usuario actualizado.
			expect(usuarioActual.update).toHaveBeenCalledWith({
				nombre: 'Ana Nueva',
				email: 'ana.nueva@example.com',
				telefono: '0988888888',
			});
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				message: 'Perfil actualizado exitosamente',
				data: {
					id: 7,
					nombre: 'Ana Nueva',
					email: 'ana.nueva@example.com',
					telefono: '0988888888',
				},
			});
		});
	});

	describe('changePassword', () => {
		test('rechaza el cambio si faltan datos obligatorios', async () => {
			// Omite currentPassword y newPassword para probar la validación de entrada.
			const req = {
				usuario: { id: 7 },
				body: {},
			};
			const res = createMockResponse();

			await authController.changePassword(req, res);

			// Verifica que el controlador exige ambas contraseñas antes de continuar.
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'Debes proporcionar la contraseña actual y la nueva',
			});
		});

		test('rechaza el cambio si la nueva contraseña es demasiado corta', async () => {
			// Envía una contraseña nueva de longitud insuficiente para activar la validación.
			const req = {
				usuario: { id: 7 },
				body: buildChangePasswordBody({ newPassword: '123' }),
			};
			const res = createMockResponse();

			await authController.changePassword(req, res);

			// Verifica que el controlador no consulta el usuario cuando la longitud falla.
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'La nueva contraseña debe tener al menos 6 caracteres',
			});
			expect(Usuario.findByPk).not.toHaveBeenCalled();
		});

		test('rechaza el cambio si la contraseña actual no coincide', async () => {
			// Simula el usuario encontrado pero con contraseña actual incorrecta.
			Usuario.findByPk.mockResolvedValue(
				createUsuarioMock({
					update: jest.fn(),
					password: 'hash-falso',
				})
			);
			bcrypt.compare.mockResolvedValue(false);

			const req = {
				usuario: { id: 7 },
				body: buildChangePasswordBody({ currentPassword: 'incorrecta' }),
			};
			const res = createMockResponse();

			await authController.changePassword(req, res);

			// Verifica que no se actualice nada si la contraseña actual no es válida.
			expect(bcrypt.compare).toHaveBeenCalledWith('incorrecta', 'hash-falso');
			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({
				success: false,
				message: 'Contraseña actual incorrecta',
			});
		});

		test('actualiza la contraseña cuando la contraseña actual es correcta', async () => {
			// Simula un usuario existente con contraseña correcta y actualización exitosa.
			const usuarioActual = createUsuarioMock({
				update: jest.fn().mockResolvedValue(true),
				password: 'hash-falso',
			});
			Usuario.findByPk.mockResolvedValue(usuarioActual);
			bcrypt.compare.mockResolvedValue(true);

			const req = {
				usuario: { id: 7 },
				body: buildChangePasswordBody(),
			};
			const res = createMockResponse();

			await authController.changePassword(req, res);

			// Verifica que la contraseña nueva se guarda solo después de validar la anterior.
			expect(bcrypt.compare).toHaveBeenCalledWith('123456', 'hash-falso');
			expect(usuarioActual.update).toHaveBeenCalledWith({ password: '654321' });
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				message: 'Contraseña actualizada exitosamente',
			});
		});
	});
});
