const DataModel = require("../utils/data_model");
const { Sequelize } = require("./index");
const Barang = require("./barang.model");

class TransaksiPenyesuaian extends DataModel {
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
      void: {
        type: Sequelize.INTEGER,
      },
    };

    this.set_db_field(db_field);
    this.set_db_name("t_transaksi_penyesuaian");
  }
}

class TransaksiPenyesuaianDetail extends DataModel {
  constructor() {
    super();
    const db_field = {
      qty: {
        type: Sequelize.INTEGER,
      },
      harga: {
        type: Sequelize.DOUBLE(11, 2),
      },
      subtotal: {
        type: Sequelize.DOUBLE(11, 2),
      },
      keterangan: {
        type: Sequelize.TEXT,
      },
    };

    const relation = [
      {
        relation_table: new TransaksiPenyesuaian(),
        relation_name: "transaksi_penyesuaian_id",
        relation: "has_one",
      },
      {
        relation_table: new Barang(),
        relation_name: "barang_id",
        relation: "has_one",
      },
    ];
    this.set_softdelete(false);
    this.set_db_field(db_field);
    this.set_db_name("t_transaksi_penyesuaian_detail");
    this.set_relation(relation);
  }
}

module.exports = { TransaksiPenyesuaian, TransaksiPenyesuaianDetail };
