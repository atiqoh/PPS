const DataModel = require("../utils/data_model");
const { Sequelize } = require("./index");
const Pegawai = require("./pegawai.model");

class Penggajian extends DataModel {
  constructor() {
    super();

    const db_field = {
      periode_bulan: {
        type: Sequelize.INTEGER,
      },
      periode_tahun: {
        type: Sequelize.INTEGER,
      },
      total_gaji_pokok: {
        type: Sequelize.DOUBLE(11, 2),
      },
      total_insentif_transport: {
        type: Sequelize.DOUBLE(11, 2),
      },
      total_insentif_makan: {
        type: Sequelize.DOUBLE(11, 2),
      },
      total_insentif_lembur: {
        type: Sequelize.DOUBLE(11, 2),
      },
      total_potongan_terlambat: {
        type: Sequelize.DOUBLE(11, 2),
      },
      total_potongan_bpjs: {
        type: Sequelize.DOUBLE(11, 2),
      },
      total_potongan_tk: {
        type: Sequelize.DOUBLE(11, 2),
      },
      total_gaji: {
        type: Sequelize.DOUBLE(11, 2),
      },
      status_closing: {
        type: Sequelize.BOOLEAN,
      },
      closed_by: {
        type: Sequelize.INTEGER,
      },
      closed_at: {
        type: Sequelize.DATE,
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
    this.set_db_name("t_penggajian");
    this.set_relation(relation);
  }
}

module.exports = Penggajian;
