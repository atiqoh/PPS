const { sequelize, Sequelize } = require("./index");
const { HakAkses, HakAksesDetail } = require("./hak_akses.model");
const { Transaksi, TransaksiDetail } = require("./traksaksi.model");
const {
  TransaksiPenyesuaian,
  TransaksiPenyesuaianDetail,
} = require("./traksaksi_penyesuaian.model");
const User = require("./user.model");
const LoginHistory = require("./login_history.model");
const Satuan = require("./satuan.model");
const Barang = require("./barang.model");

const all_db = {};
all_db.sequelize = sequelize;
all_db.Sequelize = Sequelize;

// tambah disini untuk model;
all_db.HakAkses = new HakAkses().db_sync();
all_db.User = new User().db_sync();
all_db.HakAksesDetail = new HakAksesDetail().db_sync();
all_db.LoginHistory = new LoginHistory().db_sync();
all_db.Transaksi = new Transaksi().db_sync();
all_db.TransaksiDetail = new TransaksiDetail().db_sync();
all_db.Satuan = new Satuan().db_sync();
all_db.Barang = new Barang().db_sync();
all_db.TransaksiPenyesuaian = new TransaksiPenyesuaian().db_sync();
all_db.TransaksiPenyesuaianDetail = new TransaksiPenyesuaianDetail().db_sync();

module.exports = all_db;
