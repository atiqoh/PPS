// const handleMulterError = require('../middleware/errorhandler.middleware');
const absensiController = require('../controller/absensi.controller');
// const upload = require('../middleware/upload.middleware');
const express = require('express');
const router = express.Router();

router.get('/', absensiController.getAll);
router.get('/:id', absensiController.getById);
router.put('/approve/:id', absensiController.approve);
router.put('/reject/:id', absensiController.reject);
// router.get('/photo/:attendance_id', absensiController.getPhoto);

// router.post('/checkin', upload.single('photo_url'), handleMulterError, absensiController.checkIn);

module.exports = router;