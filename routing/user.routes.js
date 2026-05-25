const userControler = require("../controller/user.controller");
const router = require("express").Router();
const multer = require("multer");
const upload = multer();
const authMiddleware = require("../middleware/auth.middleware");
router.use(authMiddleware);

router.post("/create", upload.none(), userControler.create);
router.get("/list", upload.none(), userControler.findAll);
router.put("//:id", upload.none(), userControler.update);
router.delete("/delete/:id", upload.none(), userControler.delete);
router.get("/detail/:id", userControler.findOne);
router.get("/test/", userControler.test);
module.exports = router;
