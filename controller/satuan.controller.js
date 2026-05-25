const { Sequelize, Satuan, sequelize } = require("../models/sync_db");
const Op = Sequelize.Op;
const { set_response } = require("./page.controller");
const {
  getDataFromQuery,
  kodeAutoGenerate,
  isEmpty,
} = require("../utils/util");

// CREATE: untuk enambahkan data kedalam tabel user
exports.create = async (req, res) => {
  // validate request
  // data yang didapatkan dari inputan oleh pengguna
  let params = req.body;
  // proses menyimpan kedalam database
  await Satuan.db
    .create(params)
    .then(async (data) => {
      res.json(set_response(200, "User created successfully.", data));
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
          kode: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          customer: {
            [Op.like]: `%${search}%`,
          },
        },
      ],
    });
  }

  if (!isEmpty(filter)) {
    if (typeof filter.kode != undefined && filter.kode.trim() != "") {
      console.log(filter, "fian");
      Object.assign(where, {
        kode: {
          [Op.like]: `%${filter.kode}%`,
        },
      });
    }

    if (typeof filter.nama != undefined && filter.nama.trim() != "") {
      Object.assign(where, {
        nama: {
          [Op.like]: `%${filter.nama}%`,
        },
      });
    }
  }

  let countData = await Satuan.db.count({
    where: where,
    order: [sortArr],
    paranoid: true,
  });

  await Satuan.db
    .findAll({
      where: where,
      order: [sortArr],
      limit: parseInt(limit),
      offset: parseInt(offset),
      paranoid: true,
    })
    .then((row) => {
      row.map((val) => {
        val.dataValues.canEdit = 1;
        val.dataValues.canDelete = 1;
      });
      const data = {
        count: countData,
        data: row,
      };
      res.json(set_response(200, "Sukses get data", data));
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
  const params = req.body;
  await Satuan.db
    .update(params, {
      where: { uid: id },
    })
    .then(async (count) => {
      if (count == 1) {
        const data = await Satuan.db.findOne({
          where: { uid: id },
        });
        res.json(set_response(200, "Sukses update data.", data));
      } else {
        res.json({
          message: `Cannot update hak akses with id=${id}. Maybe hak akses was not found or req.body is empty!`,
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
  Satuan.db
    .destroy({
      where: { uid: req.params.id },
    })
    .then((count) => {
      if (count == 1) {
        res.json(set_response(200, "User deleted successfully."));
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
  Satuan.db
    .findOne({ where: { uid: req.params.id } })
    .then(async (row) => {
      if (row != null) {
        res.json(set_response(200, "Sukses get data detail", row));
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
