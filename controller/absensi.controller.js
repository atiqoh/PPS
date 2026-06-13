const { Sequelize, Absensi, Pegawai, SettingGlobal } = require("../models/sync_db");
const Op = Sequelize.Op;
const { set_response } = require("./page.controller");

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

   let status_validasi = req.query.status_validasi || "";
   if (status_validasi && status_validasi !== "all") {
      where.status_validasi = status_validasi;
   }

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

   // let countData = await Absensi.db.count({
   //    where: where,
   //    paranoid: true,
   // });

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
               // count: countData,
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

function hitungTerlambat(jamStandar, jamCheckIn) {
   const [h1, m1, s1] = jamStandar.split(':').map(Number);
   const [h2, m2, s2] = jamCheckIn.split(':').map(Number);
   const standarSeconds = h1 * 3600 + m1 * 60 + s1;
   const checkInSeconds = h2 * 3600 + m2 * 60 + s2;
   const selisih = checkInSeconds - standarSeconds;
   return selisih > 0 ? selisih : 0;
}

exports.checkIn = async (req, res) => {
   try {
      const { id_pegawai, lokasi_masuk, catatan } = req.body;
      const file = req.file;

      if (!id_pegawai) {
         if (file) {
            const fs = require('fs');
            fs.unlinkSync(file.path);
         }
         return res.status(400).json(
            set_response(400, "id_pegawai wajib diisi", null)
         );
      }

      if (!file) {
         return res.status(400).json(
            set_response(400, "Foto bukti absensi wajib diupload", null)
         );
      }

      const pegawai = await Pegawai.db.findOne({
         where: { id: id_pegawai }
      });

      if (!pegawai) {
         if (file) {
            const fs = require('fs');
            fs.unlinkSync(file.path);
         }
         return res.status(404).json(
            set_response(404, "Pegawai tidak ditemukan", null)
         );
      }

      const foto_masuk = `${file.filename}`;
      const tanggal = new Date().toISOString().split('T')[0];
      const jam_masuk = new Date().toTimeString().split(' ')[0];
      const status = null;
      const status_validasi = "pending";
      let nilai_potongan = 0;
      const total_potongan = 0;

      // terkait penggajian
      const setting = await SettingGlobal.db.findOne();
      const jamStandar = setting.jam_masuk ?? 0;
      const potonganPerHari = setting.potongan_terlambat_per_hari ?? 0;
      const jamCheckIn = jam_masuk;
      const menitTerlambat = hitungTerlambat(jamStandar, jamCheckIn);
      nilai_potongan = menitTerlambat > 0 ? potonganPerHari : 0;

      const data = await Absensi.db.create({
         id_pegawai: id_pegawai,
         tanggal: tanggal,
         jam_masuk: jam_masuk,
         status: status,
         foto_masuk: foto_masuk,
         catatan: catatan ?? null,
         validasi_oleh: null,
         status_validasi: status_validasi,
         tanggal_validasi: null,
         lokasi_masuk: lokasi_masuk || null,
         nilai_potongan: nilai_potongan,
         total_potongan: total_potongan,
      });

      res.json(
         set_response(201, "Check-in berhasil", {
            data: data,
         })
      );
   } catch (error) {
      if (req.file) {
         const fs = require('fs');
         fs.unlinkSync(req.file.path);
      }
      res.status(500).json(
         set_response(500, error.message || "Terjadi kesalahan pada server", null)
      );
   }
};

exports.getPhoto = async (req, res) => {
   try {
      const { id } = req.params;
      const absensi = await Absensi.db.findOne({
         where: { id: id },
      });

      if (!absensi) {
         return res.status(404).json(
            set_response(404, "Data absensi tidak ditemukan", null)
         );
      }

      if (!absensi.foto_masuk) {
         return res.status(404).json(
            set_response(404, "Foto tidak ditemukan", null)
         );
      }

      let fileName = absensi.foto_masuk;
      const filePath = path.join(__dirname, '../uploads/absensi', fileName);

      if (!fs.existsSync(filePath)) {
         return res.status(404).json(
            set_response(404, "File foto tidak ditemukan di server", null)
         );
      }

      res.sendFile(filePath);
   } catch (error) {
      res.status(500).json(
         set_response(500, error.message || "Terjadi kesalahan pada server", null)
      );
   }
};