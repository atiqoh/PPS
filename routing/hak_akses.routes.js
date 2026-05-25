const hak_akesController = require("../controller/hak_akses.controller");
const router = require("express").Router();
const multer = require("multer");
const upload = multer();

router.post("/create", upload.none(), hak_akesController.create);
router.get("/list", upload.none(), hak_akesController.findAll);
router.put("/update/:id", upload.none(), hak_akesController.update);
router.delete("/delete/:id", upload.none(), hak_akesController.delete);
router.get("/detail/:id", hak_akesController.findOne);
router.get("/hak_akses_default", hak_akesController.hakAksesDefault);
router.post(
  "/generate_hak_akses_all/:id",
  upload.none(),
  hak_akesController.generateHakAksesAll
);

module.exports = router;
