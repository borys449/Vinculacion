const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const photoDirectory = path.join(os.tmpdir(), `animal-photo-test-${process.pid}`);
process.env.ANIMAL_UPLOAD_DIR = photoDirectory;
const { saveAnimalPhoto, getAnimalPhotoPath, deleteAnimalPhoto } = require('../utils/animalPhoto');

describe('Almacenamiento de fotos de animales', () => {
  afterAll(async () => {
    await fs.rm(photoDirectory, { recursive: true, force: true });
  });

  test('guarda y elimina una foto usando un nombre generado seguro', async () => {
    const file = {
      mimetype: 'image/png',
      buffer: Buffer.from('imagen de prueba'),
    };

    const filename = await saveAnimalPhoto(file);
    const photoPath = getAnimalPhotoPath(filename);

    expect(filename).toMatch(/^[0-9a-f-]+\.png$/);
    expect(await fs.readFile(photoPath)).toEqual(file.buffer);

    await deleteAnimalPhoto(filename);
    await expect(fs.access(photoPath)).rejects.toThrow();
  });

  test('no resuelve nombres de archivo con rutas', () => {
    expect(getAnimalPhotoPath('../secret.png')).toBeNull();
  });
});
