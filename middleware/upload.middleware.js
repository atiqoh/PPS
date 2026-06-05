const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = './uploads/absensi';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `absensi-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan (jpeg, jpg, png, gif)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: fileFilter,
});

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        status: 'error',
        message: 'Ukuran file terlalu besar. Maksimal 5MB',
      });
    }
    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }
  next();
};

module.exports = { upload, handleUploadError };