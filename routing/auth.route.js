const authController = require("../controller/auth.controller");
const router = require("express").Router();
const multer = require("multer");
const upload = multer();

router.post("/do_login", upload.none(), authController.doLogin);

module.exports = router;
