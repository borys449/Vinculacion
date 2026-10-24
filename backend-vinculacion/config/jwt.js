const REQUIRED_JWT_ERROR = 'JWT_SECRET debe definirse antes de iniciar la aplicación';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(REQUIRED_JWT_ERROR);
  }

  return secret;
};

const assertJwtSecretConfigured = () => {
  getJwtSecret();
};

module.exports = {
  getJwtSecret,
  assertJwtSecretConfigured,
};