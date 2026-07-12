const { protect, autorizar } = require('../middleware/auth');

describe('middleware/auth.js', () => {
  test('exports the auth middleware functions', () => {
    expect(typeof protect).toBe('function');
    expect(typeof autorizar).toBe('function');
  });
});