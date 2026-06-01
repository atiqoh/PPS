const DataModel = require("../utils/data_model");
const { Sequelize } = require("./index");
const Pegawai = require("./pegawai.model");

class Lembur extends DataModel {
  constructor() {
    super();

    const db_field = {
      tanggal_lembur: {
        type: Sequelize.DATEONLY,
      },
      jam_mulai: {
        type: Sequelize.TIME,
      },
      jam_selesai: {
        type: Sequelize.TIME,
      },
      durasi: {
        type: Sequelize.DOUBLE(11, 2),
      },
      keterangan: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.ENUM("Menunggu Konfirmasi", "Approved", "Reject"),
      },
      approved_at: {
        type: Sequelize.DATE,
      },
      nilai_insentif: {
        type: Sequelize.DOUBLE(11, 2),
      },
      total_insentif: {
        type: Sequelize.DOUBLE(11, 2),
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
    this.set_db_name("t_lembur");
    this.set_relation(relation);
  }
}

module.exports = Lembur;
