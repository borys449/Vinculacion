jest.mock('../config/database', () => ({
    connectDB: jest.fn(),
}));

jest.mock('../models', () => ({}));
jest.mock('../routes/auth', () => require('express').Router());
jest.mock('../routes/usuarios', () => require('express').Router());
jest.mock('../routes/cultivos', () => require('express').Router());
jest.mock('../routes/ganado', () => require('express').Router());
jest.mock('../routes/registros', () => require('express').Router());

const request = require('supertest');
const app = require('../server');

describe('server.js', () => {
    test('GET / should return the API metadata', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: 'API Finca LODANA - Sistema de Gestión Agropecuaria',
            version: '2.0.0',
            database: 'PostgreSQL',
        });
    });

    test('GET / should include Helmet security headers', async () => {
        const response = await request(app).get('/');

        expect(response.headers).toHaveProperty('x-dns-prefetch-control', 'off');
        expect(response.headers).toHaveProperty('x-frame-options');
    });
});
