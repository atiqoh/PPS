const express = require('express');
const router = express.Router();
const absensiController = require('../controller/absensi.controller');
const { upload, handleUploadError } = require('../middleware/upload.middleware');

router.get('/', absensiController.getAll);
router.get('/:id', absensiController.getById);
router.put('/approve/:id', absensiController.approve);
router.put('/reject/:id', absensiController.reject);
router.get('/photo/:id', absensiController.getPhoto);
router.post('/check-in', upload.single('foto'), handleUploadError, absensiController.checkIn);

module.exports = router;