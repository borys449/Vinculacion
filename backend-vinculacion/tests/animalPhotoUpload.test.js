const express = require('express');
const request = require('supertest');
const uploadAnimalPhoto = require('../middleware/animalPhotoUpload');

const createUploadApp = () => {
  const app = express();
  app.post('/foto', uploadAnimalPhoto, (req, res) => {
    res.status(200).json({
      success: true,
      data: req.body,
      mimetype: req.file?.mimetype,
    });
  });
  return app;
};

describe('Carga de fotos de animales', () => {
  const app = createUploadApp();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=', 'base64');

  test('acepta una imagen válida y recupera los datos del animal', async () => {
    const response = await request(app)
      .post('/foto')
      .field('data', JSON.stringify({ identificacion: 'GAN-1' }))
      .attach('foto', png, { filename: 'animal.png', contentType: 'image/png' });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ identificacion: 'GAN-1' });
    expect(response.body.mimetype).toBe('image/png');
  });

  test('rechaza formatos de archivo no permitidos', async () => {
    const response = await request(app)
      .post('/foto')
      .field('data', '{}')
      .attach('foto', Buffer.from('<svg></svg>'), { filename: 'animal.svg', contentType: 'image/svg+xml' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/JPG, PNG o WebP/);
  });

  test('rechaza archivos cuya firma no corresponde al tipo declarado', async () => {
    const response = await request(app)
      .post('/foto')
      .field('data', '{}')
      .attach('foto', Buffer.from('not an image'), { filename: 'animal.png', contentType: 'image/png' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/imagen JPG, PNG o WebP válida/);
  });
});
