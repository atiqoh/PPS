const DataModel = require("../utils/data_model");
const { Sequelize } = require("./index");
const Pegawai = require("./pegawai.model");

class Absensi extends DataModel {
  constructor() {
    super();

    const db_field = {
      tanggal: {
        type: Sequelize.DATEONLY,
      },
      jam_masuk: {
        type: Sequelize.TIME,
      },
      status: {
        type: Sequelize.STRING,
      },
      foto_masuk: {
        type: Sequelize.STRING,
      },
      catatan: {
        type: Sequelize.STRING,
      },
      validasi_oleh: {
        type: Sequelize.STRING,
      },
      status_validasi: {
        type: Sequelize.STRING,
      },
      tanggal_validasi: {
        type: Sequelize.DATE,
      },
      lokasi_masuk: {
        type: Sequelize.STRING,
      },
      nilai_potongan: {
        type: Sequelize.INTEGER,
      },
      total_potongan: {
        type: Sequelize.INTEGER,
      },
    };

    const relation = [
      {
        relation_table: new Pegawai(),
        relation_name: "id_pegawai",
        relation: "has_one",
      },
    ];

    this.set_db_field(db_field);
    this.set_db_name("t_absensi");
    this.set_relation(relation);
  }
}

module.exports = Absensi;
