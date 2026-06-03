const { Pegawai } = require("../models/sync_db");
const { set_response } = require("./page.controller");

exports.findOne = (req, res) => {
  Pegawai.db
    .findOne({ where: { uid: req.params.id } })
    .then((row) => {
      if (row != null) {
        res.json(set_response(200, "Sukses get detail pegawai", row));
      } else {
        res
          .status(400)
          .json(set_response(400, "Cannot find pegawai. Maybe it was not found!"));
      }
    })
    .catch((err) => {
      res
        .status(500)
        .json(
          set_response(
            500,
            err.message || "Terjadi kesalahan saat mengambil detail pegawai."
          )
        );
    });
};
