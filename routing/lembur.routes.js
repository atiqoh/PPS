const lemburController = require("../controller/lembur.controller");
const router = require("express").Router();
const multer = require("multer");
const upload = multer();

router.post("/check-schedule", upload.none(), lemburController.checkSchedule);
router.post("/", upload.none(), lemburController.create);
router.get("/", upload.none(), lemburController.findAll);
router.put("/:id/approve", upload.none(), lemburController.approve);
router.put("/:id/reject", upload.none(), lemburController.reject);
router.get("/:id", lemburController.findOne);
router.put("/:id", upload.none(), lemburController.update);
router.delete("/:id", upload.none(), lemburController.delete);

module.exports = router;
