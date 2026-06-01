const DataModel = require("../utils/data_model");
const { Sequelize } = require("./index");

class Jabatan extends DataModel {
  constructor() {
    super();

    const db_field = {
      nama_jabatan: {
        type: Sequelize.STRING,
      },
      gaji_pokok: {
        type: Sequelize.DOUBLE(11, 2),
      },
      insentif_transport: {
        type: Sequelize.DOUBLE(11, 2),
      },
      insentif_makan: {
        type: Sequelize.DOUBLE(11, 2),
      },
      nilai_bpjs_kesehatan: {
        type: Sequelize.DOUBLE(11, 2),
      },
      potongan_bpjs_kesehatan: {
        type: Sequelize.DOUBLE(11, 2),
      },
      nilai_bpjs_tk: {
        type: Sequelize.DOUBLE(11, 2),
      },
      potongan_bpjs_tk: {
        type: Sequelize.DOUBLE(11, 2),
      },
    };

    this.set_db_field(db_field);
    this.set_db_name("m_jabatan");
  }
}

module.exports = { Jabatan };
