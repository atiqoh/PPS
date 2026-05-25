const bcrypt = require("bcrypt");
const DataModel = require("../utils/data_model");
const { Sequelize } = require("../models/index");
const { HakAkses } = require("./hak_akses.model");

class User extends DataModel {
  constructor() {
    super();
    const db_field = {
      email: {
        type: Sequelize.STRING,
      },
      password: {
        type: Sequelize.STRING,
      },
      salt: {
        type: Sequelize.STRING,
      },
      nama: {
        type: Sequelize.STRING,
      },
      last_login: {
        type: Sequelize.DATE,
      },
    };

    const relation = [
      {
        relation_table: new HakAkses(),
        relation_name: "hak_akses_id",
        relation: "has_one",
      },
    ];

    this.set_db_field(db_field);
    this.set_db_name("m_user");
    this.set_relation(relation);
  }

  async setPassword(password) {
    let arr = {};
    arr.salt = bcrypt.genSaltSync(10);

    arr.password = await bcrypt.hash(password, arr.salt);

    return arr;
  }

  async verifyPassword(password, dbpassword) {
    let cek = bcrypt.compare(password, dbpassword);
    return cek;
  }
}

module.exports = User;
