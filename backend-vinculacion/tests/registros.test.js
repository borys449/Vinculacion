const registrosRouter = require('../routes/registros');

describe('routes/registros.js', () => {
	test('exports an express router', () => {
		expect(typeof registrosRouter.use).toBe('function');
	});
});
