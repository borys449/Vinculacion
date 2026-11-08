const multer = require('multer');

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error('La foto debe estar en formato JPG, PNG o WebP'));
    }
    callback(null, true);
  },
});

const matchesImageSignature = (file) => {
  const buffer = file.buffer;
  switch (file.mimetype) {
    case 'image/jpeg':
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/png':
      return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case 'image/webp':
      return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    default:
      return false;
  }
};

function animalPhotoUpload(req, res, next) {
  upload.single('foto')(req, res, (error) => {
    if (error) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ success: false, message: error.message });
    }

    if (req.file && !matchesImageSignature(req.file)) {
      return res.status(400).json({
        success: false,
        message: 'El archivo no contiene una imagen JPG, PNG o WebP válida',
      });
    }

    if (req.is('multipart/form-data')) {
      try {
        const data = JSON.parse(req.body.data);
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('Los datos del animal deben ser un objeto');
        }
        req.body = data;
      } catch (error) {
        if (!(error instanceof SyntaxError)) {
          return next(error);
        }
        return res.status(400).json({
          success: false,
          message: 'No se pudieron leer los datos del animal enviados',
        });
      }
    }

    next();
  });
}

module.exports = animalPhotoUpload;
