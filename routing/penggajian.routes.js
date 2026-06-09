const penggajianController = require("../controller/penggajian.controller")
// For parsing application/json (JSON payloads)
// app.use(express.json());

// For parsing application/x-www-form-urlencoded (HTML form submissions)
// app.use(express.urlencoded({ extended: true }));

const router = require("express").Router();


router.get("/getall", penggajianController.getAll);
router.post("/close_confirmation", penggajianController.calculatePayroll);
router.post("/close_payroll", penggajianController.closePayroll);

module.exports = router;