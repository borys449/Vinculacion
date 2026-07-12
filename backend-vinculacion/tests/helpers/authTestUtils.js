const createMockResponse = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	res.cookie = jest.fn().mockReturnValue(res);
	res.clearCookie = jest.fn().mockReturnValue(res);
	return res;
};

// Genera el payload base de registro y permite sobrescribir campos puntuales por caso de prueba.
const buildRegistroBody = (overrides = {}) => ({
	nombre: 'Ana',
	cedula: '1234567890',
	email: 'ana@example.com',
	telefono: '0999999999',
	area: 'administracion',
	tipo: 'administrador',
	password: '123456',
	confirmPassword: '123456',
	...overrides,
});

// Genera el payload exacto que el controller envía a Usuario.create, sin confirmPassword.
const buildRegistroCreatePayload = (overrides = {}) => ({
	nombre: 'Ana',
	cedula: '1234567890',
	email: 'ana@example.com',
	telefono: '0999999999',
	area: 'administracion',
	tipo: 'administrador',
	password: '123456',
	...overrides,
});

// Genera el payload base de login y permite ajustar usuario o contraseña según el escenario.
const buildLoginBody = (overrides = {}) => ({
	user: 'ana@example.com',
	password: '123456',
	...overrides,
});

// Genera el payload base para actualizar perfil y permite cambiar solo los campos necesarios.
const buildUpdateProfileBody = (overrides = {}) => ({
	nombre: 'Ana Nueva',
	email: 'ana.nueva@example.com',
	telefono: '0988888888',
	...overrides,
});

// Genera el payload base para cambiar contraseña y permite adaptar la prueba al caso puntual.
const buildChangePasswordBody = (overrides = {}) => ({
	currentPassword: '123456',
	newPassword: '654321',
	...overrides,
});

// Construye un usuario falso con los campos que el controller usa en cada flujo de autenticación.
const createUsuarioMock = (overrides = {}) => ({
	id: 7,
	nombre: 'Ana',
	email: 'ana@example.com',
	tipo: 'administrador',
	area: 'administracion',
	cedula: '1234567890',
	telefono: '0999999999',
	password: 'hash-falso',
	update: jest.fn(),
	matchPassword: jest.fn(),
	...overrides,
});



module.exports = {
	buildRegistroBody,
	buildRegistroCreatePayload,
	buildLoginBody,
	buildUpdateProfileBody,
	buildChangePasswordBody,
	createMockResponse,
	createUsuarioMock,
};
