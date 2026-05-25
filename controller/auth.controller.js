const {
  Sequelize,
  sequelize,
  User,
  LoginHistory,
} = require("../models/sync_db");
const Op = Sequelize.Op;
const { generateToken, deleteDataByKey } = require("../utils/util");
const { set_response } = require("./page.controller");
const { v4: uuidv4 } = require("uuid");

// CREATE: untuk enambahkan data kedalam tabel company
exports.doLogin = async (req, res) => {
  let email = req.body.email || "";
  let password = req.body.password || "";
  let deviceid = req.body.deviceid || uuidv4();

  User.db
    .findOne({
      where: {
        //your where conditions, or without them if you need ANY entry
        email: {
          [Op.like]: email,
        },
      },
      order: [["created_at", "DESC"]],
    })
    .then(async function (row) {
      if (row != null) {
        let cekPassword = await User.cls.verifyPassword(password, row.password);
        if (cekPassword) {
          let id = row.id;
          await User.db.update(
            { last_login: sequelize.fn("NOW") },
            {
              where: { id },
            }
          );
          let data = row.toJSON();
          deleteDataByKey(data, [
            "salt",
            "password",
            "created_at",
            "updated_at",
            "delete_at",
            "hak_akses_id",
          ]);
          data["deviceid"] = deviceid;
          let token = await generateToken(data);
          await LoginHistory.db.create({ deviceid: deviceid, token: token });
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
