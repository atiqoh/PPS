const DataModel = require("../utils/data_model");
const { Sequelize } = require("./index");

class Satuan extends DataModel {
  constructor() {
    super();
    const db_field = {
      kode: {
        type: Sequelize.STRING,
      },
      nama: {
        type: Sequelize.STRING,
      },
      keterangan: {
        type: Sequelize.TEXT,
      },
    };

    this.set_db_field(db_field);
    this.set_db_name("m_satuan");
  }
}

module.exports = Satuan;
