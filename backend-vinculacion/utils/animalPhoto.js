const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const photoDirectory = process.env.ANIMAL_UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'animals');
const extensionsByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const saveAnimalPhoto = async (file) => {
  const extension = extensionsByMime[file.mimetype];
  if (!extension) {
    throw new Error('Formato de foto no permitido');
  }

  await fs.mkdir(photoDirectory, { recursive: true });
  const filename = `${randomUUID()}${extension}`;
  await fs.writeFile(path.join(photoDirectory, filename), file.buffer, { flag: 'wx' });
  return filename;
};

const getAnimalPhotoPath = (filename) => {
  if (!filename || path.basename(filename) !== filename) {
    return null;
  }
  return path.join(photoDirectory, filename);
};

const deleteAnimalPhoto = async (filename) => {
  const filePath = getAnimalPhotoPath(filename);
  if (filePath) {
    await fs.rm(filePath, { force: true });
  }
};

module.exports = { saveAnimalPhoto, getAnimalPhotoPath, deleteAnimalPhoto };
