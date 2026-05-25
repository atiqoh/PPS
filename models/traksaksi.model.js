const DataModel = require("../utils/data_model");
const { Sequelize } = require("./index");
const User = require("./user.model");

class Transaksi extends DataModel {
  constructor() {
    super();
    const db_field = {
      kode: {
        type: Sequelize.STRING,
      },
      tanggal: {
        type: Sequelize.DATEONLY,
      },
      customer: {
        type: Sequelize.STRING,
      },
      netto: {
        type: Sequelize.DOUBLE(11, 2),
      },
      keterangan: {
        type: Sequelize.TEXT,
      },
    };

    const relation = [
      {
        relation_table: new User(),
        relation_name: "user_id",
        relation: "has_one",
      },
    ];

    this.set_db_field(db_field);
    this.set_db_name("t_transaksi");
    this.set_relation(relation);
  }
}

class TransaksiDetail extends DataModel {
  constructor() {
    super();
    const db_field = {
      nama_barang: {
        type: Sequelize.STRING,
      },
      qty: {
        type: Sequelize.INTEGER,
      },
      harga: {
        type: Sequelize.DOUBLE(11, 2),
      },
      subtotal: {
        type: Sequelize.DOUBLE(11, 2),
      },
    };

    const relation = [
      {
        relation_table: new Transaksi(),
        relation_name: "transaksi_id",
        relation: "has_one",
      },
    ];
    this.set_softdelete(false);
    this.set_db_field(db_field);
    this.set_db_name("t_transaksi_detail");
    this.set_relation(relation);
  }
}

module.exports = { Transaksi, TransaksiDetail };
