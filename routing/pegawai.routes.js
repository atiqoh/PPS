const pegawaiController = require("../controller/pegawai.controller");
const router = require("express").Router();

router.get("/:id", pegawaiController.findOne);

module.exports = router;
