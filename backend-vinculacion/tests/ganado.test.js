const ganadoRouter = require('../routes/ganado');

describe('routes/ganado.js', () => {
	test('exports an express router', () => {
		expect(typeof ganadoRouter.use).toBe('function');
	});
});
