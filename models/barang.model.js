const DataModel = require("../utils/data_model");
const { Sequelize } = require("./index");
const Satuan = require("./satuan.model");

class Barang extends DataModel {
  constructor() {
    super();
    const db_field = {
      kode: {
        type: Sequelize.STRING,
      },
      nama: {
        type: Sequelize.STRING,
      },
      ukuran: {
        type: Sequelize.STRING,
      },
      keterangan: {
        type: Sequelize.TEXT,
      },
    };

    const relation = [
      {
        relation_table: new Satuan(),
        relation_name: "satuan_id",
        relation: "has_one",
      },
    ];

    this.set_db_field(db_field);
    this.set_db_name("m_barang");
    this.set_relation(relation);
  }
}

module.exports = Barang;
