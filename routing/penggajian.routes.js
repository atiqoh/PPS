const penggajianController = require("../controller/penggajian.controller")

const router = require("express").Router();


router.get("/getall", penggajianController.getAll);
router.get("/calculate", penggajianController.calculatePayroll);

module.exports = router;