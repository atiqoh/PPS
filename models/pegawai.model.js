const bcrypt = require("bcrypt");
const DataModel = require("../utils/data_model");
const { Sequelize } = require("./index");
const { Jabatan } = require("./jabatan.model");

class Pegawai extends DataModel {
  constructor() {
    super();

    const db_field = {
      nik: {
        type: Sequelize.STRING,
      },
      nama: {
        type: Sequelize.STRING,
      },
      tempat_lahir: {
        type: Sequelize.STRING,
      },
      tanggal_lahir: {
        type: Sequelize.DATEONLY,
      },
      no_telp: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
      },
      tanggal_masuk: {
        type: Sequelize.DATEONLY,
      },
      tanggal_keluar: {
        type: Sequelize.DATEONLY,
      },
      password_hash: {
        type: Sequelize.STRING,
      },
      role: {
        type: Sequelize.ENUM("Admin", "Pegawai"),
      },
      is_active: {
        type: Sequelize.BOOLEAN,
      },
      flag_duplicate_nik: {
        type: Sequelize.BOOLEAN,
      },
    };

    const relation = [
      {
        relation_table: new Jabatan(),
        relation_name: "id_jabatan",
        relation: "has_one",
      },
    ];

    this.set_db_field(db_field);
    this.set_db_name("m_pegawai");
    this.set_relation(relation);
  }

  async setPassword(password) {
    return {
      password_hash: await bcrypt.hash(password, 10),
    };
  }

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

module.exports = Pegawai;
