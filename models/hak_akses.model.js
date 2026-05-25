const DataModel = require("../utils/data_model");
const { Sequelize } = require("./index");

class HakAkses extends DataModel {
  constructor() {
    super();
    const db_field = {
      nama: {
        type: Sequelize.STRING,
      },
    };

    this.set_db_field(db_field);
    this.set_db_name("m_hak_akses");
  }
}

class HakAksesDetail extends DataModel {
  constructor() {
    super();
    const db_field = {
      kode: {
        type: Sequelize.STRING,
      },
    };

    const relation = [
      {
        relation_table: new HakAkses(),
        relation_name: "hak_akses_id",
        relation: "has_one",
      },
    ];
    this.set_softdelete(false);
    this.set_db_field(db_field);
    this.set_db_name("m_hak_akses_detail");
    this.set_relation(relation);
  }
}

module.exports = { HakAkses, HakAksesDetail };
