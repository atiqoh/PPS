const { Pegawai } = require("../models/sync_db");
const { verifyToken } = require("../utils/util");
const { set_response } = require("../controller/page.controller");

const authMiddleware = async (req, res, next) => {
  const Authorization = req.get("Authorization");

  if (!Authorization) {
    res.status(401).json(set_response(401, "Unauthorized")).end();
  } else {
    try {
      const token = Authorization.replaceAll("Bearer ", "");
      let decoded = verifyToken(token);

      const user = await Pegawai.db.findOne({
        where: {
          id: decoded.id,
        },
      });

      if (!user) {
        res.status(401).json(set_response(401, "Unauthorized")).end();
      } else {
        req.userid = user.id;
        next();
      }
    } catch (err) {
      console.log(err);
      res.status(401).json(set_response(401, "Unauthorized")).end();
    }
  }
};

module.exports = authMiddleware;
