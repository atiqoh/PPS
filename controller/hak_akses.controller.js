const {
  Sequelize,
  HakAkses,
  HakAksesDetail,
  sequelize,
} = require("../models/sync_db");
const Op = Sequelize.Op;
const { set_response } = require("./page.controller");
const { getDataFromQuery, removeByChar } = require("../utils/util");

// CREATE: untuk enambahkan data kedalam tabel user
exports.create = async (req, res) => {
  // validate request
  if (!req.body.nama) {
    return res.status(400).send({
      message: "Nama tidak boleh kosong",
    });
  }
  // data yang didapatkan dari inputan oleh pengguna
  const params = req.body;
  // proses menyimpan kedalam database
  await HakAkses.db
    .create(params)
    .then(async (data) => {
      await Promise.all(
        params.detail.map(async (val, index) => {
          const params_detail = {
            kode: val,
            hak_akses_id: data.id,
          };
          await HakAksesDetail.db.create(params_detail);
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
  let sortBy = req.body.sort_by || "created_at";
  let sortType = req.body.sort_type || "desc";
  let search = req.body.search || "";
  sortBy = sortBy.split(",");
  sortType = sortType.split(",");
  let sortArr = [];
  for (let index = 0; index < sortBy.length; index++) {
    let element = [sortBy[index], sortType[index]];
    sortArr.push(element);
  }
  let limit = req.body.limit || 10;
  let page = req.body.page || 1;
  let offset = (page - 1) * limit;
  let filter = {};
  if (search != "") {
    Object.assign(filter, {
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

  let countData = await HakAkses.db.count({
    where: filter,
    order: [sortArr],
    paranoid: true,
  });

  await HakAkses.db
    .findAll({
      where: filter,
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
  await HakAkses.db
    .update(params, {
      where: { uid: id },
    })
    .then(async (count) => {
      if (count == 1) {
        const dataHakAkses = await HakAkses.db.findOne({ where: { uid: id } });
        await getDataFromQuery(
          sequelize,
          `delete FROM m_hak_akses_detail where hak_akses_id = ${dataHakAkses.id}`
        );
        await Promise.all(
          params.detail.map(async (val, index) => {
            const params_detail = {
              kode: val,
              hak_akses_id: dataHakAkses.id,
            };
            await HakAksesDetail.db.create(params_detail);
          })
        );
        const data = await HakAkses.db.findOne({
          where: { id: dataHakAkses.id },
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
  HakAkses.db
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
  HakAkses.db
    .findOne({ where: { uid: req.params.id } })
    .then(async (row) => {
      if (row != null) {
        const detailHakAkses = await HakAksesDetail.db.findAll({
          where: { hak_akses_id: row.id },
        });
        row.dataValues.detail = detailHakAkses;
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

exports.hakAksesDefault = async (req, res) => {
  const all_data = await getDataFromQuery(
    sequelize,
    "SELECT * FROM for_hak_akses ORDER BY parent asc"
  );
  let hak_akses = [];
  let cek = [];
  let cekSection = [];
  await Promise.all(
    all_data.map(async (list, index) => {
      if (cekSection.includes(list.section)) {
        let idx = cekSection.indexOf(list.section);
        if (cek.includes(list.parent)) {
          let idx_parent = cek.indexOf(list.parent);
          hak_akses[idx].akses[idx_parent].child.push({
            id: list.child,
            name: removeByChar(list.child, "_"),
            parentId: list.parent,
          });
        } else {
          cek.push(list.parent);
          hak_akses[idx].akses.push({
            id: list.parent,
            name: removeByChar(list.parent, "_"),
            child: [
              {
                id: list.child,
                name: removeByChar(list.child, "_"),
                parentId: list.parent,
              },
            ],
          });
        }
      } else {
        cekSection.push(list.section);
        cek.push(list.parent);
        hak_akses.push({
          id: list.section,
          name: list.section,
          akses: [
            {
              id: list.parent,
              name: removeByChar(list.parent, "_"),
              child: [
                {
                  id: list.child,
                  name: removeByChar(list.child, "_"),
                  parentId: list.parent,
                },
              ],
            },
          ],
        });
      }
    })
  );

  res.json(set_response(200, "Sukses ambil data", hak_akses));
};

exports.generateHakAksesAll = async (req, res) => {
  const id = req.params.id;

  await getDataFromQuery(
    sequelize,
    `delete FROM m_hak_akses_detail where hak_akses_id = ${id}`
  );
  const all_data = await getDataFromQuery(
    sequelize,
    "SELECT * FROM for_hak_akses ORDER BY parent asc"
  );
  await Promise.all(
    all_data.map(async (val, index) => {
      const params_detail = {
        kode: val.child,
        hak_akses_id: id,
      };
      await HakAksesDetail.db.create(params_detail);
    })
  );

  res.json(set_response(200, "Generate hak akses sukses"));
};
