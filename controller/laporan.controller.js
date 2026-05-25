const { Sequelize, sequelize } = require("../models/sync_db");
const Op = Sequelize.Op;
const { set_response } = require("./page.controller");
const {
  getDataFromQuery,
  kodeAutoGenerate,
  isEmpty,
} = require("../utils/util");

// Mengambil data sesuai id yang dikirimkan
exports.posisi_stok = async (req, res) => {
  let tanggal = req.query.tanggal || "";
  if (tanggal == "") {
    return res.status(400).send({
      message: "Tanggal can not be empty",
    });
  }
  let query = `SELECT
        barang_id,
        brg.kode,
        brg.nama,
        SUM( qty ) AS total 
    FROM
        t_transaksi_penyesuaian_detail ttpd
        JOIN t_transaksi_penyesuaian ttp ON ttp.id = ttpd.transaksi_penyesuaian_id
        join m_barang brg on brg.id = ttpd.barang_id
    WHERE ttp.tanggal <= '${tanggal}' 
    GROUP BY brg.nama`;
  let data = await getDataFromQuery(sequelize, query);

  res.json(set_response(200, "Sukses get data laporan", data));
};

exports.kartu_stok = async (req, res) => {
  let tanggal_awal = req.query.tanggal_awal || "";
  let tanggal_akhir = req.query.tanggal_akhir || "";
  let barang = req.query.barang || "";
  if (tanggal_awal == "" || tanggal_akhir == "") {
    return res.status(400).send({
      message: "Tanggal can not be empty",
    });
  }
  let query = `SELECT
            barang_id,
            brg.nama,
			brg.kode as kode_barang,
            ttp.kode,
            ttp.tanggal,
            ttpd.keterangan,
            ttpd.qty
        FROM
            t_transaksi_penyesuaian_detail ttpd
            JOIN t_transaksi_penyesuaian ttp ON ttp.id = ttpd.transaksi_penyesuaian_id
            JOIN m_barang brg on brg.id = ttpd.barang_id
        WHERE ttp.tanggal >= '${tanggal_awal}' and ttp.tanggal <= '${tanggal_akhir}'
        ORDER BY barang_id ASC`;
  let data = await getDataFromQuery(sequelize, query);

  res.json(set_response(200, "Sukses get data laporan", data));
};
