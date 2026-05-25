const satuanController = require("../controller/satuan.controller");
const router = require("express").Router();
const multer = require("multer");
const upload = multer();

router.post("/create", upload.none(), satuanController.create);
router.get("/list", upload.none(), satuanController.findAll);
router.put("/update/:id", upload.none(), satuanController.update);
router.delete("/delete/:id", upload.none(), satuanController.delete);
router.get("/detail/:id", satuanController.findOne);

module.exports = router;
