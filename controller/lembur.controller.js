const { Sequelize, Lembur, Pegawai, Penggajian, SettingGlobal } = require("../models/sync_db");
const Op = Sequelize.Op;
const { set_response } = require("./page.controller");
const { isEmpty } = require("../utils/util");

const getPeriodFromDate = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return {
    periode_bulan: date.getMonth() + 1,
    periode_tahun: date.getFullYear(),
  };
};

const parseTime = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    return value.length === 5 ? `${value}:00` : value;
  }
  return value;
};

const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = String(timeStr).split(":");
  const h = parseInt(parts[0] || 0, 10);
  const m = parseInt(parts[1] || 0, 10);
  return h * 60 + m;
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

  if (!params.id_pegawai || !params.tanggal_lembur || !params.jam_mulai || !params.jam_selesai) {
    return res.status(400).json(
      set_response(400, "id_pegawai, tanggal_lembur, jam_mulai, dan jam_selesai wajib diisi")
    );
  }

  // compute duration in minutes on the backend (override client value)
  const startMin = timeToMinutes(params.jam_mulai);
  const endMin = timeToMinutes(params.jam_selesai);
  if (startMin === null || endMin === null) {
    return res.status(400).json(set_response(400, "Format jam_mulai atau jam_selesai tidak valid"));
  }
  let durasi = endMin - startMin;
  if (durasi <= 0) durasi += 24 * 60; // handle overnight
  params.durasi = durasi; // in minutes

  // overlap check: same pegawai, same tanggal, status != Reject
  try {
    const whereOverlap = {
      id_pegawai: params.id_pegawai,
      tanggal_lembur: params.tanggal_lembur,
      status: { [Op.not]: "Reject" },
    };
    const existingRows = await Lembur.db.findAll({ where: whereOverlap });
    const conflicts = existingRows.filter((row) => isOverlap(row, params.jam_mulai, params.jam_selesai));
    if (conflicts.length > 0) {
      return res.status(400).json(set_response(400, "Pegawai sudah memiliki pengajuan lembur yang bertabrakan.", { conflicts }));
    }
  } catch (err) {
    return res.status(500).json(set_response(500, err.message || "Terjadi kesalahan saat memeriksa jadwal lembur."));
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
    .findOne({ where: { id: req.params.id } })
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

  try {
    const existing = await Lembur.db.findOne({ where: { id: id } });
    if (!existing) {
      return res.status(400).json(set_response(400, `Cannot find lembur with id=${id}.`));
    }

    if (existing.status !== "Menunggu Konfirmasi") {
      return res
        .status(400)
        .json(
          set_response(
            400,
            "Only lembur with status Menunggu Konfirmasi can be updated."
          )
        );
    }

    const updateData = { ...params };
    const newJamMulai = updateData.jam_mulai || existing.jam_mulai;
    const newJamSelesai = updateData.jam_selesai || existing.jam_selesai;
    if (newJamMulai && newJamSelesai) {
      const startMin = timeToMinutes(newJamMulai);
      const endMin = timeToMinutes(newJamSelesai);
      if (startMin === null || endMin === null) {
        return res.status(400).json(set_response(400, "Format jam_mulai atau jam_selesai tidak valid"));
      }
      let durasi = endMin - startMin;
      if (durasi <= 0) durasi += 24 * 60;
      updateData.durasi = durasi;
    }

    // overlap check on update: exclude current record id
    try {
      const checkPegawai = updateData.id_pegawai || existing.id_pegawai;
      const checkTanggal = updateData.tanggal_lembur || existing.tanggal_lembur;
      const whereOverlap = {
        id_pegawai: checkPegawai,
        tanggal_lembur: checkTanggal,
        status: { [Op.not]: "Reject" },
        id: { [Op.not]: id },
      };
      const existingRows = await Lembur.db.findAll({ where: whereOverlap });
      const conflicts = existingRows.filter((row) => isOverlap(row, newJamMulai, newJamSelesai));
      if (conflicts.length > 0) {
        return res.status(400).json(set_response(400, "Pegawai sudah memiliki pengajuan lembur yang bertabrakan.", { conflicts }));
      }
    } catch (err) {
      return res.status(500).json(set_response(500, err.message || "Terjadi kesalahan saat memeriksa jadwal lembur."));
    }

    const [count] = await Lembur.db.update(updateData, {
      where: { id: id },
    });

      if (count == 1) {
      const data = await Lembur.db.findOne({ where: { id: id } });
      return res.json(set_response(200, "Sukses mengubah pengajuan lembur.", data));
    }

    return res.json({
      message: `Cannot update lembur with id=${id}. Maybe req.body is empty!`,
      data: req.body,
    });
  } catch (err) {
    return res
      .status(500)
      .json(
        set_response(
          500,
          err.message || "Terjadi kesalahan saat mengupdate pengajuan lembur."
        )
      );
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const existing = await Lembur.db.findOne({ where: { id: id } });
    if (!existing) {
      return res.status(400).json(set_response(400, `Cannot find lembur with id=${id}.`));
    }

    if (existing.status !== "Menunggu Konfirmasi") {
      return res
        .status(400)
        .json(
          set_response(
            400,
            "Only lembur with status Menunggu Konfirmasi can be deleted."
          )
        );
    }

    const count = await Lembur.db.destroy({ where: { id: id } });
    if (count == 1) {
      return res.json(set_response(200, "Sukses menghapus pengajuan lembur."));
    }

    return res.json(
      set_response(400, "Cannot delete lembur. Maybe lembur was not found!")
    );
  } catch (err) {
    return res
      .status(500)
      .json(
        set_response(
          500,
          err.message || "Terjadi kesalahan saat menghapus pengajuan lembur."
        )
      );
  }
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
    where.id = { [Op.not]: excludeUid };
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
  try {
    const lembur = await Lembur.db.findOne({ where: { id: id } });
    if (!lembur) {
      return res
        .status(400)
        .json(set_response(400, `Cannot approve lembur with id=${id}. Maybe lembur was not found!`));
    }

    if (lembur.status !== "Menunggu Konfirmasi") {
      return res
        .status(400)
        .json(
          set_response(
            400,
            `Cannot approve lembur with status ${lembur.status}.`
          )
        );
    }

    const period = getPeriodFromDate(lembur.tanggal_lembur);
    if (!period) {
      return res
        .status(400)
        .json(set_response(400, "Tanggal lembur tidak valid untuk menentukan periode penggajian."));
    }

    const setting = await SettingGlobal.db.findOne();
    const insentifPerJam = parseFloat(setting?.insentif_lembur_per_jam || 0);
    const startMin = timeToMinutes(lembur.jam_mulai);
    const endMin = timeToMinutes(lembur.jam_selesai);
    let durationMinutes = endMin - startMin;
    if (durationMinutes <= 0) durationMinutes += 24 * 60;
    const durationHours = durationMinutes / 60;
    const lemburValue = durationHours * insentifPerJam;

    const updateLemburFields = {
      nilai_insentif: lemburValue,
      total_insentif: lemburValue,
    };

    if (lemburValue > 0) {
      const payroll = await Penggajian.db.findOne({
        where: {
          id_pegawai: lembur.id_pegawai,
          periode_bulan: period.periode_bulan,
          periode_tahun: period.periode_tahun,
        },
      });

      if (payroll) {
        const updatePayroll = {
          total_insentif_lembur: Sequelize.literal(
            `COALESCE(total_insentif_lembur, 0) + ${lemburValue}`
          ),
        };

        if (payroll.total_gaji != null) {
          updatePayroll.total_gaji = Sequelize.literal(
            `COALESCE(total_gaji, 0) + ${lemburValue}`
          );
        }

        await Penggajian.db.update(updatePayroll, {
          where: {
            id_pegawai: lembur.id_pegawai,
            periode_bulan: period.periode_bulan,
            periode_tahun: period.periode_tahun,
          },
        });
      } else {
        await Penggajian.db.create({
          id_pegawai: lembur.id_pegawai,
          periode_bulan: period.periode_bulan,
          periode_tahun: period.periode_tahun,
          total_gaji_pokok: 0,
          total_insentif_transport: 0,
          total_insentif_makan: 0,
          total_insentif_lembur: lemburValue,
          total_potongan_terlambat: 0,
          total_potongan_bpjs: 0,
          total_potongan_tk: 0,
          total_gaji: lemburValue,
          status_closing: false,
          closed_by: null,
          closed_at: null,
        });
      }
    }

    await Lembur.db.update(
      {
        ...updateLemburFields,
        status: "Approved",
        approved_at: Sequelize.fn("NOW"),
      },
      {
        where: { id: id },
      }
    );

    const data = await Lembur.db.findOne({ where: { id: id } });
    res.json(set_response(200, "Sukses menyetujui pengajuan lembur.", data));
  } catch (err) {
    res
      .status(500)
      .json(
        set_response(
          500,
          err.message || "Terjadi kesalahan saat menyetujui pengajuan lembur."
        )
      );
  }
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
        where: { id: id },
      }
    )
    .then(async (count) => {
        if (count == 1) {
        const data = await Lembur.db.findOne({ where: { id: id } });
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
