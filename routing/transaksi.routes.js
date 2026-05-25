const transaksiControlller = require("../controller/transaksi.controller");
const router = require("express").Router();
const multer = require("multer");
const upload = multer();

router.post("/create", upload.none(), transaksiControlller.create);
router.get("/list", upload.none(), transaksiControlller.findAll);
router.put("/update/:id", upload.none(), transaksiControlller.update);
router.delete("/delete/:id", upload.none(), transaksiControlller.delete);
router.get("/detail/:id", transaksiControlller.findOne);

module.exports = router;
