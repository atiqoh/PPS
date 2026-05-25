const {
  Sequelize,
  Transaksi,
  TransaksiDetail,
  sequelize,
} = require("../models/sync_db");
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
  let kode = await kodeAutoGenerate("t_transaksi", "TR");
  // data yang didapatkan dari inputan oleh pengguna
  let params = req.body;
  params["kode"] = kode;
  // proses menyimpan kedalam database
  await Transaksi.db
    .create(params)
    .then(async (data) => {
      await Promise.all(
        params.detail.map(async (val, index) => {
          const params_detail = {
            nama_barang: val.barang,
            qty: val.qty,
            harga: val.harga,
            subtotal: val.subtotal,
            transaksi_id: data.id,
          };
          await TransaksiDetail.db.create(params_detail);
        })
      );
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

    if (typeof filter.customer != undefined && filter.customer.trim() != "") {
      Object.assign(where, {
        customer: {
          [Op.like]: `%${filter.customer}%`,
        },
      });
    }
  }

  let countData = await Transaksi.db.count({
    where: where,
    order: [sortArr],
    paranoid: true,
  });

  await Transaksi.db
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
  await Transaksi.db
    .update(params, {
      where: { uid: id },
    })
    .then(async (count) => {
      if (count == 1) {
        const dataTransaksi = await Transaksi.db.findOne({
          where: { uid: id },
        });
        await getDataFromQuery(
          sequelize,
          `delete FROM t_transaksi_detail where transaksi_id = ${dataTransaksi.id}`
        );
        await Promise.all(
          params.detail.map(async (val, index) => {
            const params_detail = {
              nama_barang: val.barang,
              qty: val.qty,
              harga: val.harga,
              subtotal: val.subtotal,
              transaksi_id: dataTransaksi.id,
            };
            await TransaksiDetail.db.create(params_detail);
          })
        );
        const data = await Transaksi.db.findOne({
          where: { id: dataTransaksi.id },
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
  Transaksi.db
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
  Transaksi.db
    .findOne({ where: { uid: req.params.id } })
    .then(async (row) => {
      if (row != null) {
        const detailTransaksi = await TransaksiDetail.db.findAll({
          where: { transaksi_id: row.id },
        });
        row.dataValues.detail = detailTransaksi;
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
