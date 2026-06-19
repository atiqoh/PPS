const penggajianController = require("../controller/penggajian.controller")
const router = require("express").Router();


router.get("/", penggajianController.getAll);
router.get("/:uid", penggajianController.getByUid);
router.post("/close", penggajianController.calculatePayroll);
router.patch("/close/edit", penggajianController.updatePenggajian);
router.patch("/close/confirm", penggajianController.closePayroll);
router.get("/slipgaji/:uid", penggajianController.viewSlipGaji);
router.get("/slipgaji/:uid/cetak", penggajianController.cetakSlipGaji);

module.exports = router;