const usuariosRouter = require('../routes/usuarios');

describe('routes/usuarios.js', () => {
	test('exports an express router', () => {
		expect(typeof usuariosRouter.use).toBe('function');
	});
});
