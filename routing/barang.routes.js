const barangController = require("../controller/barang.controller");
const router = require("express").Router();
const multer = require("multer");
const upload = multer();

router.post("/create", upload.none(), barangController.create);
router.get("/list", upload.none(), barangController.findAll);
router.put("/update/:id", upload.none(), barangController.update);
router.delete("/delete/:id", upload.none(), barangController.delete);
router.get("/detail/:id", barangController.findOne);

module.exports = router;
