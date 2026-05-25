const laporanController = require("../controller/laporan.controller");
const router = require("express").Router();
const multer = require("multer");
const upload = multer();
const authMiddleware = require("../middleware/auth.middleware");
router.use(authMiddleware);

router.get("/posisi_stok", upload.none(), laporanController.posisi_stok);
router.get("/kartu_stok", upload.none(), laporanController.kartu_stok);
module.exports = router;
