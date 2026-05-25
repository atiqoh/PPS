const { where } = require("sequelize");
const { Sequelize, sequelize, User } = require("../models/sync_db");
const Op = Sequelize.Op;
const { set_response } = require("./page.controller");
const { isEmpty } = require("../utils/util");

// CREATE: untuk enambahkan data kedalam tabel user
exports.create = async (req, res) => {
  // validate request
  if (!req.body.email || !req.body.password) {
    return res.status(400).send({
      message: "Email and Password can not be empty",
    });
  }
  // data yang didapatkan dari inputan oleh pengguna
  const user = req.body;
  // proses menyimpan kedalam database
  await User.db
    .create(user)
    .then(async (data) => {
      const forUpdate = await User.cls.setPassword(data.password);
      id = data.id;
      data.update(forUpdate);
      res.json(set_response(200, "Sukses create data.", data));
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

// READ: menampilkan atau mengambil semua data sesuai model dari database
exports.findAll = async (req, res) => {
  let sortBy = req.query.sort_by || "created_at";
  let sortType = req.query.sort_type || "desc";
  let search = req.query.search || "";
  let filter = req.query.filter || {};
  sortBy = sortBy.split(",");
  sortType = sortType.split(",");
  let sortArr = [];
  for (let index = 0; index < sortBy.length; index++) {
    let element = [sortBy[index], sortType[index]];
    sortArr.push(element);
  }
  let limit = req.query.limit || 10;
  let page = req.query.page || 1;
  let offset = (page - 1) * limit;
  let where = {};
  if (search != "") {
    Object.assign(where, {
      [Op.or]: [
        {
          email: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          nama: {
            [Op.like]: `%${search}%`,
          },
        },
      ],
    });
  }

  if (!isEmpty(filter)) {
    if (typeof filter.nama != undefined && filter.nama != "") {
      Object.assign(where, {
        nama: {
          [Op.like]: `%${filter.nama}%`,
        },
      });
    }

    if (typeof filter.email != undefined && filter.email != "") {
      Object.assign(where, {
        email: {
          [Op.like]: `%${filter.email}%`,
        },
      });
    }

    if (typeof filter.aktif != undefined && filter.aktif != "") {
      Object.assign(where, {
        aktif: {
          [Op.eq]: filter.aktif,
        },
      });
    }
  }

  let countUser = await User.db.count({
    where: where,
    order: [sortArr],
    paranoid: true,
  });

  await User.db
    .findAll({
      where: where,
      order: [sortArr],
      limit: parseInt(limit),
      offset: parseInt(offset),
      paranoid: true,
    })
    .then((user) => {
      user.map((val) => {
        val.dataValues.canEdit = 1;
        val.dataValues.canDelete = 1;
      });
      const data = {
        count: countUser,
        data: user,
      };
      res.json(set_response(200, "Users retrieved successfully.", data));
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

// UPDATE: Merubah data sesuai dengan id yang dikirimkan sebagai params
exports.update = async (req, res) => {
  const id = req.params.id;
  await User.db
    .update(req.body, {
      where: { uid: id },
    })
    .then(async (num) => {
      if (num == 1) {
        let cekPassword = req.body.password || "";
        if (cekPassword != "") {
          await User.db.findByPk(id).then(async (data) => {
            const forUpdate = await User.cls.setPassword(data.password);
            data.update(forUpdate);
          });
        }
        const data = await User.db.findOne({ where: { id: req.params.id } });
        res.json(set_response(200, "Sukses update data.", data));
      } else {
        res.json({
          message: `Cannot update user with id=${id}. Maybe user was not found or req.body is empty!`,
          data: req.body,
        });
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

// DELETE: Menghapus data sesuai id yang dikirimkan
exports.delete = (req, res) => {
  const id = req.params.id;
  User.db
    .destroy({
      where: { uid: req.params.id },
    })
    .then((num) => {
      if (num == 1) {
        res.json(set_response(200, "Sukses delete data"));
      } else {
        res.json(
          set_response(400, "`Cannot delete user. Maybe user was not found!`")
        );
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

// Mengambil data sesuai id yang dikirimkan
exports.findOne = (req, res) => {
  User.db
    .findOne({ where: { uid: req.params.id } })
    .then((user) => {
      if (user != null) {
        res.json(set_response(200, "User retrieved successfully.", user));
      } else {
        res
          .status(400)
          .json(
            set_response(400, "Cannot find user. Maybe user was not found!")
          );
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

exports.test = async (req, res) => {
  let params = {
    join: [
      {
        table: "m_hak_akses ha",
        on: "ha.id = m_user.hak_akses_id",
        type: "inner",
      },
    ],
    where: "m_user.id != 0",
  };
  let data = await User.cls.get(params);
  res.json(set_response(200, "User created successfully.", data));
};
