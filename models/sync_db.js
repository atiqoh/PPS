const { sequelize, Sequelize } = require("./index");
const Pegawai = require("./pegawai.model");
const { Jabatan } = require("./jabatan.model");
const SettingGlobal = require("./settingglobal.model");
const Absensi = require("./absensi.model");
const Notifikasi = require("./notifikasi.model");
const Lembur = require("./lembur.model");
const Penggajian = require("./penggajian.model");

const all_db = {};
all_db.sequelize = sequelize;
all_db.Sequelize = Sequelize;

// tambah disini untuk model;
all_db.Pegawai = new Pegawai().db_sync();
all_db.Jabatan = new Jabatan().db_sync();
all_db.SettingGlobal = new SettingGlobal().db_sync();
all_db.Absensi = new Absensi().db_sync();
all_db.Notifikasi = new Notifikasi().db_sync();
all_db.Lembur = new Lembur().db_sync();
all_db.Penggajian = new Penggajian().db_sync();

module.exports = all_db;
