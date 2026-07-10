const authRouter = require('../routes/auth');

describe('routes/auth.js', () => {
	test('exports an express router', () => {
		expect(typeof authRouter.use).toBe('function');
	});
});
