const { Sequelize, Absensi, Pegawai } = require("../models/sync_db");
const Op = Sequelize.Op;
const { set_response } = require("./page.controller");
const { isEmpty } = require("../utils/util");

const path = require("path");
const fs = require("fs");

exports.getAll = async (req, res) => {
   let sortBy = req.query.sort_by || "tanggal";
   let sortType = req.query.sort_type || "desc";
   let search = req.query.search || "";
   let limit = req.query.limit || 10;
   let page = req.query.page || 1;
   let offset = (page - 1) * limit;
   let where = {};

   // sorting (bisa multiple column)
   sortBy = sortBy.split(",");
   sortType = sortType.split(",");
   let sortArr = [];
   for (let index = 0; index < sortBy.length; index++) {
      sortArr.push([sortBy[index], sortType[index]]);
   }

   // search di beberapa field
   if (search != "") {
      Object.assign(where, {
         [Op.or]: [
            { status: { [Op.like]: `%${search}%` } },
            { catatan: { [Op.like]: `%${search}%` } },
            { status_validasi: { [Op.like]: `%${search}%` } },
         ],
      });
   }

   let startDate = req.query.startDate || "";
   let endDate = req.query.endDate || "";

   // range tanggal
   if (startDate && endDate) {
      where.tanggal = {
         [Op.gte]: startDate,
         [Op.lte]: endDate
      };
   } else if (startDate) {
      where.tanggal = { [Op.gte]: startDate };
   } else if (endDate) {
      where.tanggal = { [Op.lte]: endDate };
   }

   let countData = await Absensi.db.count({
      where: where,
      paranoid: true,
   });

   await Absensi.db
      .findAll({
         where: where,
         order: sortArr,
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
                  const pegawai = await Pegawai.db.findOne({
                     where: { id: row.id_pegawai },
                  });
                  row.dataValues.pegawai = pegawai || null;
               }
            }),
         );

         res.json(
            set_response(200, "Sukses menampilkan seluruh data absensi.", {
               count: countData,
               data: rows,
            }),
         );
      })
      .catch((err) => {
         res
            .status(500)
            .json(
               set_response(
                  500,
                  err.message || "Terjadi kesalahan saat mengambil data absensi.",
               ),
            );
      });
};

exports.getById = async (req, res) => {
   try {
      const { id } = req.params;
      const data = await Absensi.db.findOne({
         where: { id: id },
         paranoid: true,
      });

      if (!data) {
         return res.json(
            set_response(404, "Data absensi tidak ditemukan.", null)
         );
      }

      if (data.id_pegawai) {
         const pegawai = await Pegawai.db.findOne({
            where: { id: data.id_pegawai }
         });
         data.dataValues.pegawai = pegawai || null;
      }

      res.json(
         set_response(200, "Sukses menampilkan detail absensi.", {
            data: data,
         })
      );
   } catch (error) {
      res.status(500).json(
         set_response(
            500,
            error.message || "Terjadi kesalahan saat mengambil detail absensi."
         )
      );
   }
};

exports.approve = async (req, res) => {
   try {
      const { id } = req.params;
      const { validasi_oleh } = req.body;

      if (!validasi_oleh) {
         return res.status(400).json(
            set_response(400, "validasi_oleh wajib diisi", null)
         );
      }

      const existingData = await Absensi.db.findOne({
         where: { id: id },
         paranoid: true,
      });

      if (!existingData) {
         return res.status(404).json(
            set_response(404, "Data absensi tidak ditemukan", null)
         );
      }

      if (existingData.status_validasi !== "pending") {
         return res.status(400).json(
            set_response(400, `Tidak dapat approve. Status validasi saat ini: ${existingData.status_validasi}`, null)
         );
      }

      await Absensi.db.update(
         {
            status_validasi: "approved",
            status: "hadir",
            validasi_oleh: validasi_oleh,
            tanggal_validasi: new Date(),
         },
         {
            where: { id: id },
         }
      );

      const updatedData = await Absensi.db.findOne({
         where: { id: id },
      });

      res.json(
         set_response(200, "Absensi berhasil disetujui", {
            data: updatedData,
         })
      );
   } catch (error) {
      res.status(500).json(
         set_response(500, error.message || "Terjadi kesalahan pada server", null)
      );
   }
};

exports.reject = async (req, res) => {
   try {
      const { id } = req.params;
      const { validasi_oleh, catatan } = req.body;

      if (!validasi_oleh) {
         return res.status(400).json(
            set_response(400, "validasi_oleh wajib diisi", null)
         );
      }

      if (!catatan) {
         return res.status(400).json(
            set_response(400, "catatan wajib diisi (alasan reject)", null)
         );
      }

      const existingData = await Absensi.db.findOne({
         where: { id: id },
         paranoid: true,
      });

      if (!existingData) {
         return res.status(404).json(
            set_response(404, "Data absensi tidak ditemukan", null)
         );
      }

      if (existingData.status_validasi !== "pending") {
         return res.status(400).json(
            set_response(400, `Tidak dapat reject. Status validasi saat ini: ${existingData.status_validasi}`, null)
         );
      }

      await Absensi.db.update(
         {
            status_validasi: "rejected",
            catatan: catatan,
            validasi_oleh: validasi_oleh,
            tanggal_validasi: new Date(),
         },
         {
            where: { id: id },
         }
      );

      const updatedData = await Absensi.db.findOne({
         where: { id: id },
      });

      res.json(
         set_response(200, "Absensi berhasil ditolak", {
            data: updatedData,
         })
      );
   } catch (error) {
      res.status(500).json(
         set_response(500, error.message || "Terjadi kesalahan pada server", null)
      );
   }
};