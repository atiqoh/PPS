const DataModel = require("../utils/data_model");
const { Sequelize } = require("./index");
const Pegawai = require("./pegawai.model");

class Notifikasi extends DataModel {
  constructor() {
    super();

    const db_field = {
      type: {
        type: Sequelize.STRING,
      },
      title: {
        type: Sequelize.STRING,
      },
      message: {
        type: Sequelize.TEXT,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
      },
      link: {
        type: Sequelize.STRING,
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
    this.set_db_name("t_notifikasi");
    this.set_relation(relation);
  }
}

module.exports = Notifikasi;
