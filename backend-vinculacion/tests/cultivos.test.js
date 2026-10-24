const cultivosRouter = require('../routes/cultivos');

describe('routes/cultivos.js', () => {
	test('exports an express router', () => {
		expect(typeof cultivosRouter.use).toBe('function');
	});
});
