const { Sequelize, sequelize, Pegawai } = require("../models/sync_db");
const Op = Sequelize.Op;
const { generateToken, deleteDataByKey } = require("../utils/util");
const { set_response } = require("./page.controller");

// CREATE: untuk enambahkan data kedalam tabel company
exports.doLogin = async (req, res) => {
  let email = req.body.email || "";
  let password = req.body.password || "";

  Pegawai.db
    .findOne({
      where: {
        email: {
          [Op.like]: email,
        },
      },
      order: [["created_at", "DESC"]],
    })
    .then(async function (row) {
      if (row != null) {
        let cekPassword = await Pegawai.cls.verifyPassword(
          password,
          row.password_hash
        );
        if (cekPassword) {
          let data = row.toJSON();
          deleteDataByKey(data, [
            "password_hash",
            "created_at",
            "updated_at",
            "delete_at",
            "id_jabatan",
          ]);
          let token = await generateToken(data);
          res.json(set_response(200, "Login berhasil", token));
        } else {
          res
            .status(500)
            .json(set_response(500, "Login gagal password/email salah"));
        }
      } else {
        res
          .status(500)
          .json(set_response(500, "Login gagal password/email salah"));
      }
    })
    .catch((err) => {
      res
        .status(500)
        .json(
          set_response(
            500,
            err.message || "Some error occurred while retrieving user."
          )
        );
    });
};
