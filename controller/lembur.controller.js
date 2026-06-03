const { Sequelize, Lembur, Pegawai } = require("../models/sync_db");
const Op = Sequelize.Op;
const { set_response } = require("./page.controller");
const { isEmpty } = require("../utils/util");

const parseTime = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    return value.length === 5 ? `${value}:00` : value;
  }
  return value;
};

const isOverlap = (existing, newFrom, newTo) => {
  const fromExisting = existing.jam_mulai;
  const toExisting = existing.jam_selesai;
  return newFrom < toExisting && newTo > fromExisting;
};

exports.create = async (req, res) => {
  const params = req.body;
  params.jam_mulai = parseTime(params.jam_mulai);
  params.jam_selesai = parseTime(params.jam_selesai);

  if (!params.id_pegawai || !params.tanggal_lembur || !params.jam_mulai || !params.jam_selesai || !params.durasi) {
    return res.status(400).json(
      set_response(400, "id_pegawai, tanggal_lembur, jam_mulai, jam_selesai, dan durasi wajib diisi")
    );
  }

  if (!params.status) {
    params.status = "Menunggu Konfirmasi";
  }

  await Lembur.db
    .create(params)
    .then((data) => {
      res.json(set_response(200, "Sukses menambahkan pengajuan lembur.", data));
    })
    .catch((err) => {
      res
        .status(500)
        .json(
          set_response(
            500,
            err.message || "Terjadi kesalahan saat membuat pengajuan lembur."
          )
        );
    });
};

exports.findAll = async (req, res) => {
  let sortBy = req.query.sort_by || "created_at";
  let sortType = req.query.sort_type || "desc";
  let search = req.query.search || "";
  let filter = req.query.filter || {};
  sortBy = sortBy.split(",");
  sortType = sortType.split(",");
  let sortArr = [];
  for (let index = 0; index < sortBy.length; index++) {
    sortArr.push([sortBy[index], sortType[index]]);
  }
  let limit = req.query.limit || 10;
  let page = req.query.page || 1;
  let offset = (page - 1) * limit;
  let where = {};

  if (search != "") {
    Object.assign(where, {
      [Op.or]: [
        {
          keterangan: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          status: {
            [Op.like]: `%${search}%`,
          },
        },
      ],
    });
  }

  if (!isEmpty(filter)) {
    if (typeof filter.id_pegawai != undefined && filter.id_pegawai != "") {
      Object.assign(where, {
        id_pegawai: filter.id_pegawai,
      });
    }
    if (typeof filter.status != undefined && filter.status != "") {
      Object.assign(where, {
        status: filter.status,
      });
    }
    if (typeof filter.tanggal_lembur != undefined && filter.tanggal_lembur != "") {
      Object.assign(where, {
        tanggal_lembur: filter.tanggal_lembur,
      });
    }
  }

  let countData = await Lembur.db.count({
    where: where,
    order: [sortArr],
    paranoid: true,
  });

  await Lembur.db
    .findAll({
      where: where,
      order: [sortArr],
      limit: parseInt(limit),
      offset: parseInt(offset),
      paranoid: true,
    })
    .then(async (rows) => {
      await Promise.all(
        rows.map(async (row) => {
          row.dataValues.canEdit = 1;
          row.dataValues.canDelete = 1;
          if (row.id_pegawai) {
            const pegawai = await Pegawai.db.findOne({ where: { id: row.id_pegawai } });
            row.dataValues.pegawai = pegawai || null;
          }
        })
      );

      res.json(
        set_response(200, "Sukses menampilkan seluruh pengajuan lembur.", {
          count: countData,
          data: rows,
        })
      );
    })
    .catch((err) => {
      res
        .status(500)
        .json(
          set_response(
            500,
            err.message || "Terjadi kesalahan saat mengambil data lembur."
          )
        );
    });
};

exports.findOne = async (req, res) => {
  Lembur.db
    .findOne({ where: { uid: req.params.id } })
    .then(async (row) => {
      if (row != null) {
        if (row.id_pegawai) {
          const pegawai = await Pegawai.db.findOne({ where: { id: row.id_pegawai } });
          row.dataValues.pegawai = pegawai || null;
        }
        res.json(set_response(200, "Sukses menampilkan detail pengajuan lembur.", row));
      } else {
        res
          .status(400)
          .json(set_response(400, "Cannot find lembur. Maybe it was not found!"));
      }
    })
    .catch((err) => {
      res
        .status(500)
        .json(
          set_response(
            500,
            err.message || "Terjadi kesalahan saat mengambil detail lembur."
          )
        );
    });
};

exports.update = async (req, res) => {
  const id = req.params.id;
  const params = req.body;
  if (params.jam_mulai) params.jam_mulai = parseTime(params.jam_mulai);
  if (params.jam_selesai) params.jam_selesai = parseTime(params.jam_selesai);

  await Lembur.db
    .update(params, {
      where: { uid: id },
    })
    .then(async (count) => {
      if (count == 1) {
        const data = await Lembur.db.findOne({ where: { uid: id } });
        res.json(set_response(200, "Sukses mengubah pengajuan lembur.", data));
      } else {
        res.json({
          message: `Cannot update lembur with id=${id}. Maybe lembur was not found or req.body is empty!`,
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
            err.message || "Terjadi kesalahan saat mengupdate pengajuan lembur."
          )
        );
    });
};

exports.delete = (req, res) => {
  const id = req.params.id;
  Lembur.db
    .destroy({
      where: { uid: req.params.id },
    })
    .then((count) => {
      if (count == 1) {
        res.json(set_response(200, "Sukses menghapus pengajuan lembur."));
      } else {
        res.json(
          set_response(400, "Cannot delete lembur. Maybe lembur was not found!")
        );
      }
    })
    .catch((err) => {
      res
        .status(500)
        .json(
          set_response(
            500,
            err.message || "Terjadi kesalahan saat menghapus pengajuan lembur."
          )
        );
    });
};

exports.checkSchedule = async (req, res) => {
  const params = req.body;
  const id_pegawai = params.id_pegawai;
  const tanggal_lembur = params.tanggal_lembur;
  const jam_mulai = parseTime(params.jam_mulai);
  const jam_selesai = parseTime(params.jam_selesai);
  const excludeUid = params.exclude_uid || null;

  if (!id_pegawai || !tanggal_lembur || !jam_mulai || !jam_selesai) {
    return res.status(400).json(
      set_response(400, "id_pegawai, tanggal_lembur, jam_mulai, dan jam_selesai wajib diisi")
    );
  }

  const where = {
    id_pegawai,
    tanggal_lembur,
    status: {
      [Op.not]: "Reject",
    },
  };
  if (excludeUid) {
    where.uid = { [Op.not]: excludeUid };
  }

  const rows = await Lembur.db.findAll({ where });
  const conflicts = rows.filter((row) => isOverlap(row, jam_mulai, jam_selesai));

  res.json(
    set_response(200, "Sukses memeriksa jadwal lembur.", {
      conflict: conflicts.length > 0,
      conflicts,
    })
  );
};

exports.approve = async (req, res) => {
  const id = req.params.id;
  await Lembur.db
    .update(
      {
        status: "Approved",
        approved_at: Sequelize.fn("NOW"),
      },
      {
        where: { uid: id },
      }
    )
    .then(async (count) => {
      if (count == 1) {
        const data = await Lembur.db.findOne({ where: { uid: id } });
        res.json(set_response(200, "Sukses menyetujui pengajuan lembur.", data));
      } else {
        res.json(
          set_response(400, `Cannot approve lembur with id=${id}. Maybe lembur was not found!`)
        );
      }
    })
    .catch((err) => {
      res
        .status(500)
        .json(
          set_response(
            500,
            err.message || "Terjadi kesalahan saat menyetujui pengajuan lembur."
          )
        );
    });
};

exports.reject = async (req, res) => {
  const id = req.params.id;
  await Lembur.db
    .update(
      {
        status: "Reject",
        approved_at: Sequelize.fn("NOW"),
      },
      {
        where: { uid: id },
      }
    )
    .then(async (count) => {
      if (count == 1) {
        const data = await Lembur.db.findOne({ where: { uid: id } });
        res.json(set_response(200, "Sukses menolak pengajuan lembur.", data));
      } else {
        res.json(
          set_response(400, `Cannot reject lembur with id=${id}. Maybe lembur was not found!`)
        );
      }
    })
    .catch((err) => {
      res
        .status(500)
        .json(
          set_response(
            500,
            err.message || "Terjadi kesalahan saat menolak pengajuan lembur."
          )
        );
    });
};
